import * as ServerEvents from "../types/serverEvents"
import { GlobalContext } from "../types/context"
import ValueCollection from "./valueCollection"
import ServerOptions, { Options } from "./serverOptions"
import RouteList from "./router"
import handleRequest, { getPreviousHours } from "../functions/web/handleRequest"
import handleWSOpen from "../functions/web/handleWSOpen"
import handleWSMessage from "../functions/web/handleWSMessage"
import handleWSClose from "../functions/web/handleWSClose"
import WebSocket from "src/types/webSocket"
import { pathParser } from "./URLObject"
import { currentVersion } from "./middlewareBuilder"
import Route from "../types/route"
import { getAllFilesFilter } from "../misc/getAllFiles"
import { promises as fs } from "fs"

import uWebsocket from "uWebSockets.js"
import path from "path"
import os from "os"
import RouteFileBuilder from "./routeFile"

export default class Webserver extends RouteList {
	private globalContext: GlobalContext
	private server: uWebsocket.TemplatedApp = uWebsocket.App()
	private socket: uWebsocket.us_listen_socket = 0

	/**
	 * Initialize a new Server
	 * @example
	 * ```
	 * const controller = new Server({
	 *   port: 8000
	 * })
	 * ```
	 * @since 3.0.0
	*/ constructor(
		/** The Server Options */ options: Options = {}
	) {
		super()

		const fullOptions = new ServerOptions(options).getOptions()
		this.globalContext = {
			controller: this,
			contentTypes: {},
			defaultHeaders: {},
			options: fullOptions,
			requests: {
				total: 0,
				0: 0, 1: 0, 2: 0, 3: 0,
				4: 0, 5: 0, 6: 0, 7: 0,
				8: 0, 9: 0, 10: 0, 11: 0,
				12: 0, 13: 0, 14: 0, 15: 0,
				16: 0, 17: 0, 18: 0, 19: 0,
				20: 0, 21: 0, 22: 0, 23: 0
			}, webSockets: {
				opened: {
					total: 0,
					0: 0, 1: 0, 2: 0, 3: 0,
					4: 0, 5: 0, 6: 0, 7: 0,
					8: 0, 9: 0, 10: 0, 11: 0,
					12: 0, 13: 0, 14: 0, 15: 0,
					16: 0, 17: 0, 18: 0, 19: 0,
					20: 0, 21: 0, 22: 0, 23: 0
				}, messages: {
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
				}
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
				websocket: [],
				static: [],
			}, cache: {
				files: new ValueCollection(undefined, undefined, fullOptions.cache),
				middlewares: new ValueCollection(undefined, undefined, fullOptions.cache),
				routes: new ValueCollection(undefined, undefined, fullOptions.cache)
			}
		}

		// Stats Cleaner
		setInterval(() => {
			const previousHours = getPreviousHours()

			this.globalContext.requests[previousHours[6]] = 0
			this.globalContext.data.incoming[previousHours[6]] = 0
			this.globalContext.data.outgoing[previousHours[6]] = 0
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
	*/ setOptions(
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
	*/ start() {
		return new Promise(async(resolve: (value: ServerEvents.StartSuccess) => void, reject: (reason: ServerEvents.StartError) => void) => {
			let stopExecution = false
			const externalPaths = await this.loadExternalPaths()

			for (let middlewareIndex = 0; middlewareIndex < this.middlewares.length; middlewareIndex++) {
				const middleware = this.middlewares[middlewareIndex]
				if (!('data' in middleware)) {
					reject(new Error(`Middleware ${(middleware as any).name} is outdated!`))
					stopExecution = true

					break
				}; if (!('initEvent' in middleware.data)) continue

				try {
					if (middleware.version > currentVersion) throw new Error('Middleware version cannot be higher than current supported version')
					await Promise.resolve(middleware.data.initEvent!(middleware.localContext, middleware.config, this.globalContext))
				} catch (error: any) {
					reject(error)
					stopExecution = true

					break
				}
			}; if (stopExecution) return

			if (this.globalContext.options.ssl.enabled) {
				try {
					await fs.readFile(path.resolve(this.globalContext.options.ssl.keyFile))
					await fs.readFile(path.resolve(this.globalContext.options.ssl.certFile))
				} catch {
					throw new Error(`Cant access your SSL Key or Cert file! (${this.globalContext.options.ssl.keyFile} / ${this.globalContext.options.ssl.certFile})`)
				}

				try {
					if (this.globalContext.options.ssl.caFile) await fs.readFile(path.resolve(this.globalContext.options.ssl.caFile))
					if (this.globalContext.options.ssl.dhParamFile) await fs.readFile(path.resolve(this.globalContext.options.ssl.dhParamFile))
				} catch {
					throw new Error(`Cant access your SSL Ca or Dhparam file! (${this.globalContext.options.ssl.caFile} / ${this.globalContext.options.ssl.dhParamFile})`)
				}

				this.server = uWebsocket.SSLApp({
					key_file_name: path.resolve(this.globalContext.options.ssl.keyFile),
					cert_file_name: path.resolve(this.globalContext.options.ssl.certFile),
					ca_file_name: this.globalContext.options.ssl.caFile ? path.resolve(this.globalContext.options.ssl.caFile) : undefined,
          dh_params_file_name: this.globalContext.options.ssl.dhParamFile ? path.resolve(this.globalContext.options.ssl.dhParamFile) : undefined,
				})
			} else this.server = uWebsocket.App()

			this.server
				.any('/*', (res, req) => handleRequest(req, res, null, 'http', this.globalContext))
				.ws('/*', {
					maxBackpressure: 512 * 1024 * 1024,
					sendPingsAutomatically: true,
					maxPayloadLength: this.globalContext.options.body.maxSize * 1e6,
					upgrade: (res, req, connection) => handleRequest(req, res, connection, 'upgrade', this.globalContext),
					open: (ws: any) => handleWSOpen(ws, this.globalContext),
					message: (ws: any, message) => handleWSMessage(ws, message, this.globalContext),
					close: (ws: any, code, message) => handleWSClose(ws, message, this.globalContext)
				})

			const routes = await this.getData()
			this.globalContext.routes.normal = routes.routes
			this.globalContext.routes.websocket = routes.webSockets
			this.globalContext.routes.static = routes.statics
			this.globalContext.contentTypes = routes.contentTypes
			this.globalContext.defaultHeaders = routes.defaultHeaders

			this.globalContext.routes.normal.push(...externalPaths.routes)
			this.globalContext.routes.websocket.push(...externalPaths.webSockets)

			this.server.listen(this.globalContext.options.bind, this.globalContext.options.port, (listen) => {
				if (!listen) return reject(new Error(`Port ${this.globalContext.options.port} is already in use`))

				this.socket = listen
				return resolve({ success: true, port: this.globalContext.options.port, message: 'WEBSERVER STARTED' })
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
	*/ async reload() {
		this.globalContext.cache.files.clear()
		this.globalContext.cache.routes.clear()

		const routes = await this.getData()
		this.globalContext.routes.normal = routes.routes
		this.globalContext.routes.websocket = routes.webSockets
		this.globalContext.routes.static = routes.statics
		this.globalContext.contentTypes = routes.contentTypes
		this.globalContext.defaultHeaders = routes.defaultHeaders

		const externalPaths = await this.loadExternalPaths()
		this.globalContext.routes.normal.push(...externalPaths.routes)
		this.globalContext.routes.websocket.push(...externalPaths.webSockets)

		this.globalContext.webSockets = {
			opened: {
				total: 0,
				0: 0, 1: 0, 2: 0, 3: 0,
				4: 0, 5: 0, 6: 0, 7: 0,
				8: 0, 9: 0, 10: 0, 11: 0,
				12: 0, 13: 0, 14: 0, 15: 0,
				16: 0, 17: 0, 18: 0, 19: 0,
				20: 0, 21: 0, 22: 0, 23: 0
			}, messages: {
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
			}
		}; this.globalContext.data = {
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
	*/ async stop() {
		this.globalContext.cache.files.clear()
		this.globalContext.cache.routes.clear()
		uWebsocket.us_listen_socket_close(this.socket)

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
		const loadedRoutes: {
			routes: Route[]
			webSockets: WebSocket[]
		} = {
			routes: [],
			webSockets: []
		}

		for (const loadPath of (await this.getData()).loadPaths) {
			if (loadPath.type === 'cjs') {
				for (const file of await getAllFilesFilter(loadPath.path, 'js')) {
					const route: unknown = require(file)

					if (
						!route ||
						!(route instanceof RouteFileBuilder)
					) throw new Error(`Invalid Route @ ${file}`)

					const routeInfos = await route.getData(loadPath.prefix)
					for (const routeInfo of routeInfos.routes) {
						routeInfo.data.validations.push(...loadPath.validations)
						routeInfo.data.headers = Object.assign(routeInfo.data.headers, loadPath.headers)
					}

					for (const routeInfo of routeInfos.webSockets) {
						routeInfo.data.validations.push(...loadPath.validations)
					}

					loadedRoutes.routes.push(...routeInfos.routes)
					loadedRoutes.webSockets.push(...routeInfos.webSockets)
				}
			} else {
				for (const file of await getAllFilesFilter(loadPath.path, 'js')) {
					const path = os.platform() === 'win32'
						? `file:///${file}`
						: file

					const route: unknown = (await import(path)).default

					if (
						!route ||
						!(route instanceof RouteFileBuilder)
					) throw new Error(`Invalid Route @ ${file}`)

					const routeInfos = await route.getData(loadPath.prefix)
					for (const routeInfo of routeInfos.routes) {
						routeInfo.data.validations.push(...loadPath.validations)
						routeInfo.data.headers = Object.assign(routeInfo.data.headers, loadPath.headers)
					}

					for (const routeInfo of routeInfos.webSockets) {
						routeInfo.data.validations.push(...loadPath.validations)
					}

					loadedRoutes.routes.push(...routeInfos.routes)
					loadedRoutes.webSockets.push(...routeInfos.webSockets)
				}
			}
		}

		return loadedRoutes
	}
}