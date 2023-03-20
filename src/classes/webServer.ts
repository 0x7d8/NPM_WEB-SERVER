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

import http2 from "http2"
import http from "http"

export default class Webserver extends RouteList {
	private globalContext: GlobalContext
	private server: http.Server | http2.Http2SecureServer

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
				let key: Buffer, cert: Buffer
				try {
					key = await fs.readFile(this.globalContext.options.https.keyFile)
					cert = await fs.readFile(this.globalContext.options.https.certFile)
				} catch (e) {
					throw new Error(`Cant access your HTTPS Key or Cert file! (${this.globalContext.options.https.keyFile} / ${this.globalContext.options.https.certFile})`)
				}
	
				this.server = http2.createSecureServer({
					key, cert, allowHTTP1: true
				})
			} else this.server = new http.Server()

			this.server.on('request', (req, res) => handleHTTPRequest(req, res, this.globalContext))

			this.globalContext.routes.normal = this.getRoutes().routes
			this.globalContext.routes.event = this.getRoutes().events
			this.globalContext.routes.static = this.getRoutes().statics

			this.globalContext.routes.normal.push(...loadedRoutes as Route[])

			this.server.listen(this.globalContext.options.port, this.globalContext.options.bind)
			this.server.once('listening', () => resolve({ success: true, port: this.globalContext.options.port, message: 'WEBSERVER STARTED' }))
			this.server.once('error', (error: Error) => { this.server.close(); reject({ success: false, error, message: 'WEBSERVER ERRORED' }) })
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

		await this.stop()
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
		this.server.close()
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

		return new Promise((resolve: (value: ServerEvents.StopSuccess) => void, reject: (reason: ServerEvents.StopError) => void) => {
			this.server.once('close', () => resolve({ success: true, message: 'WEBSERVER CLOSED' }))
			this.server.once('error', (error: Error) => reject({ success: false, error, message: 'WEBSERVER CLOSING ERRORED' }))
		})
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