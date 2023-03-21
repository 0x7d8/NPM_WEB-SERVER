import * as ServerEvents from "../interfaces/serverEvents"
import { GlobalContext } from "../interfaces/context"
import ValueCollection from "./valueCollection"
import ServerOptions, { Options } from "./serverOptions"
import RouteList, { pathParser } from "./router"
import handleHTTPRequest, { getPreviousHours } from "../functions/web/handleHTTPRequest"
import { RouteFile } from "../interfaces/external"
import Route from "../interfaces/route"
import { getAllFilesFilter } from "../misc/getAllFiles"
import { promises as fs } from "fs"

import uWebsocket from "uWebSockets.js"

export default class Webserver extends RouteList {
	private globalContext: GlobalContext
	private server: uWebsocket.TemplatedApp
	private socket: uWebsocket.us_listen_socket

	/**
	 * Initialize a new Server
	 * @example
	 * ```
	 * const controller = new Server({
	 *   port: 8000
	 * })
	 * ```
	 * @since 3.0.0
	*/
	constructor(
		/** The Server Options */ options: Options = {}
	) {
		super()

		this.globalContext = {
			controller: this,
			options: new ServerOptions(options).getOptions(),
			requests: {
				total: 0,
				0: 0, 1: 0, 2: 0, 3: 0,
				4: 0, 5: 0, 6: 0, 7: 0,
				8: 0, 9: 0, 10: 0, 11: 0,
				12: 0, 13: 0, 14: 0, 15: 0,
				16: 0, 17: 0, 18: 0, 19: 0,
				20: 0, 21: 0, 22: 0, 23: 0
			}, middlewares: this.middlewares,
			data: {
				incoming: {
					total: 0,
					0: 0, 1: 0, 2: 0, 3: 0,
					4: 0, 5: 0, 6: 0, 7: 0,
					8: 0, 9: 0, 10: 0, 11: 0,
					12: 0, 13: 0, 14: 0, 15: 0,
					16: 0, 17: 0, 18: 0, 19: 0,
					20: 0, 21: 0, 22: 0, 23: 0
				}, outgoing: {
					total: 0,
					0: 0, 1: 0, 2: 0, 3: 0,
					4: 0, 5: 0, 6: 0, 7: 0,
					8: 0, 9: 0, 10: 0, 11: 0,
					12: 0, 13: 0, 14: 0, 15: 0,
					16: 0, 17: 0, 18: 0, 19: 0,
					20: 0, 21: 0, 22: 0, 23: 0
				}
			}, routes: {
				normal: [],
				static: [],
				event: [],
			}, cache: {
				files: new ValueCollection(),
				routes: new ValueCollection()
			}
		}

		// Stats Cleaner
		setInterval(() => {
			const previousHours = getPreviousHours()

			this.globalContext.requests[previousHours[0] - 1] = 0
			this.globalContext.data.incoming[previousHours[0] - 1] = 0
			this.globalContext.data.outgoing[previousHours[0] - 1] = 0
		}, 300000)
	}

	/**
	 * Override the set Server Options
	 * @example
	 * ```
	 * const controller = new Server({ })
	 * 
	 * controller.setOptions({
	 *   port: 6900
	 * })
	 * ```
	 * @since 3.0.0
	*/
	setOptions(
		/** The Options */ options: Options
	) {
		this.globalContext.options = new ServerOptions(options).getOptions()

		return this
	}

	/**
	 * Start the Server
	 * @example
	 * ```
	 * const controller = new Server({ })
	 * 
	 * controller.start()
	 *   .then((res) => {
	 *     console.log(`Server started on port ${res.port}`)
	 *   })
	 *   .catch((err) => {
	 *     console.error(err)
	 *   })
	 * ```
	 * @since 3.0.0
	*/
	start() {
		return new Promise(async(resolve: (value: ServerEvents.StartSuccess) => void, reject: (reason: ServerEvents.StartError) => void) => {
			let stopExecution = false
			const loadedRoutes = await this.loadExternalPaths().catch((error) => {
				reject({ success: false, error, message: 'WEBSERVER ERRORED' })
				stopExecution = true
			})

			if (stopExecution) return

			if (this.globalContext.options.https.enabled) {
				try {
					await fs.readFile(this.globalContext.options.https.keyFile)
					await fs.readFile(this.globalContext.options.https.certFile)
				} catch (e) {
					throw new Error(`Cant access your HTTPS Key or Cert file! (${this.globalContext.options.https.keyFile} / ${this.globalContext.options.https.certFile})`)
				}
	
				this.server = uWebsocket.SSLApp({
					ca_file_name: this.globalContext.options.https.keyFile,
					cert_file_name: this.globalContext.options.https.certFile
				})
			} else this.server = uWebsocket.App()

			this.server.any('/*', (res, req) => handleHTTPRequest(req, res, this.globalContext))

			this.globalContext.routes.normal = this.getRoutes().routes
			this.globalContext.routes.event = this.getRoutes().events
			this.globalContext.routes.static = this.getRoutes().statics

			this.globalContext.routes.normal.push(...loadedRoutes as Route[])

			this.server.listen(this.globalContext.options.bind, this.globalContext.options.port, (listen) => {
				if (!listen) reject({ success: false, error: listen as any, message: 'WEBSERVER ERRORED' })

				this.socket = listen
				resolve({ success: true, port: this.globalContext.options.port, message: 'WEBSERVER STARTED' })
			})
		})
	}

	/**
	 * Reload the Server
	 * @example
	 * ```
	 * const controller = new Server({ })
	 * 
	 * controller.reload()
	 *   .then((res) => {
	 *     console.log(`Server reloaded and started on port ${res.port}`)
	 *   })
	 *   .catch((err) => {
	 *     console.error(err)
	 *   })
	 * ```
	 * @since 3.0.0
	*/
	async reload() {
		this.globalContext.cache.files.clear()
		this.globalContext.cache.routes.clear()

		this.globalContext.routes.normal = this.getRoutes().routes
		this.globalContext.routes.event = this.getRoutes().events
		this.globalContext.routes.static = this.getRoutes().statics

		this.globalContext.routes.normal.push(...await this.loadExternalPaths())

		this.globalContext.data = {
			incoming: {
				total: 0,
				0: 0, 1: 0, 2: 0, 3: 0,
				4: 0, 5: 0, 6: 0, 7: 0,
				8: 0, 9: 0, 10: 0, 11: 0,
				12: 0, 13: 0, 14: 0, 15: 0,
				16: 0, 17: 0, 18: 0, 19: 0,
				20: 0, 21: 0, 22: 0, 23: 0
			}, outgoing: {
				total: 0,
				0: 0, 1: 0, 2: 0, 3: 0,
				4: 0, 5: 0, 6: 0, 7: 0,
				8: 0, 9: 0, 10: 0, 11: 0,
				12: 0, 13: 0, 14: 0, 15: 0,
				16: 0, 17: 0, 18: 0, 19: 0,
				20: 0, 21: 0, 22: 0, 23: 0
			}
		}; this.globalContext.requests = {
			total: 0,
			0: 0, 1: 0, 2: 0, 3: 0,
			4: 0, 5: 0, 6: 0, 7: 0,
			8: 0, 9: 0, 10: 0, 11: 0,
			12: 0, 13: 0, 14: 0, 15: 0,
			16: 0, 17: 0, 18: 0, 19: 0,
			20: 0, 21: 0, 22: 0, 23: 0
		}

		this.stop()
		await this.start()

		return this
	}

	/**
	 * Stop the Server
	 * @example
	 * ```
	 * const controller = new Server({ })
	 * 
	 * controller.stop()
	 *   .then((res) => {
	 *     console.log('Server stopped')
	 *   })
	 *   .catch((err) => {
	 *     console.error(err)
	 *   })
	 * ```
	 * @since 3.0.0
	*/
	stop() {
		uWebsocket.us_listen_socket_close(this.socket)
		this.globalContext.cache.files.clear()
		this.globalContext.cache.routes.clear()

		this.globalContext.routes.normal = this.getRoutes().routes
		this.globalContext.routes.event = this.getRoutes().events
		this.globalContext.routes.static = this.getRoutes().statics

		this.globalContext.data = {
			incoming: {
				total: 0,
				0: 0, 1: 0, 2: 0, 3: 0,
				4: 0, 5: 0, 6: 0, 7: 0,
				8: 0, 9: 0, 10: 0, 11: 0,
				12: 0, 13: 0, 14: 0, 15: 0,
				16: 0, 17: 0, 18: 0, 19: 0,
				20: 0, 21: 0, 22: 0, 23: 0
			}, outgoing: {
				total: 0,
				0: 0, 1: 0, 2: 0, 3: 0,
				4: 0, 5: 0, 6: 0, 7: 0,
				8: 0, 9: 0, 10: 0, 11: 0,
				12: 0, 13: 0, 14: 0, 15: 0,
				16: 0, 17: 0, 18: 0, 19: 0,
				20: 0, 21: 0, 22: 0, 23: 0
			}
		}; this.globalContext.requests = {
			total: 0,
			0: 0, 1: 0, 2: 0, 3: 0,
			4: 0, 5: 0, 6: 0, 7: 0,
			8: 0, 9: 0, 10: 0, 11: 0,
			12: 0, 13: 0, 14: 0, 15: 0,
			16: 0, 17: 0, 18: 0, 19: 0,
			20: 0, 21: 0, 22: 0, 23: 0
		}

		return { success: true, message: 'WEBSERVER CLOSED' }
	}


	/** Load all External Paths */
	private async loadExternalPaths() {
		const loadedRoutes: Route[] = []

		for (const loadPath of this.getRoutes().loadPaths) {
			if (loadPath.type === 'cjs') {
				for (const file of await getAllFilesFilter(loadPath.path, 'js')) {
					const route: Partial<RouteFile> = require(file)

					if (
						!('method' in route) ||
						!('path' in route) ||
						!('code' in route)
					) throw new Error(`Invalid Route at ${file}`)

					loadedRoutes.push({
						type: 'route',
						method: route.method,
						path: pathParser([ loadPath.prefix, route.path ]),
						pathArray: pathParser([ loadPath.prefix, route.path ]).split('/'),
						code: route.code,
						data: {
							validations: loadPath.validations
						}
					})
				}
			} else {
				for (const file of await getAllFilesFilter(loadPath.path, 'js')) {
					const route: Partial<RouteFile> = (await import(file)).default

					if (
						!('method' in route) ||
						!('path' in route) ||
						!('code' in route)
					) throw new Error(`Invalid Route at ${file}`)

					loadedRoutes.push({
						type: 'route',
						method: route.method,
						path: pathParser([ loadPath.prefix, route.path ]),
						pathArray: pathParser([ loadPath.prefix, route.path ]).split('/'),
						code: route.code,
						data: {
							validations: loadPath.validations
						}
					})
				}
			}
		}

		return loadedRoutes
	}
}