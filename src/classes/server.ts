import { GlobalContext } from "../types/context"
import ValueCollection from "./valueCollection"
import parseOptions, { Options } from "../functions/parseOptions"
import RouteList from "./router"
import handleHTTPRequest from "../functions/web/handleHTTPRequest"
import handleWSOpen from "../functions/web/handleWSOpen"
import handleWSMessage from "../functions/web/handleWSMessage"
import handleWSClose from "../functions/web/handleWSClose"
import { OpenAPIObject } from "../types/openAPI3"
import WebSocket from "../types/webSocket"
import { currentVersion } from "./middlewareBuilder"
import HTTP from "../types/http"
import { MiddlewareInitted } from "../types/internal"
import RouteFile from "./router/file"
import { getFilesRecursively } from "rjutils-collection"
import { HttpRequest, WsClose, WsConnect, WsMessage } from "../types/external"
import mergeClasses from "../functions/mergeClasses"
import generateOpenAPI3 from "../functions/generateOpenAPI3"
import DataStat from "./dataStat"
import Logger from "./logger"
import { promises as fs } from "fs"

import uWebsocket from "@rjweb/uws"
import path from "path"
import os from "os"

/**
 * A Server Instance containing a built in router and http modules
 * @example
 * ```
 * const server = new Server(...)
 * ```
 * @since 3.0.0
*/ export default class Server<GlobContext extends Record<any, any> = {}, Middlewares extends MiddlewareInitted[] = []> extends RouteList<GlobContext, Middlewares> {
	protected globalContext: GlobalContext
	protected server: uWebsocket.TemplatedApp = uWebsocket.App()
	protected socket: uWebsocket.us_listen_socket = 0

	/**
	 * Initialize a new Server
	 * @example
	 * ```
	 * const controller = new Server({
	 *   port: 8000
	 * })
	 * 
	 * module.exports.server = controller
	 * ```
	 * @since 3.0.0
	*/ constructor(
		/** The Server Options */ options: Options = {},
		/** The Middlewares */ middlewares: Middlewares = [] as any,
		/** The Default GlobalContext Values */ globContext: GlobContext = {} as any
	) {
		super()

		this.middlewares = middlewares

		const fullOptions = parseOptions(options)
		this.globalContext = {
			controller: this as any,
			contentTypes: {},
			logger: new Logger(fullOptions.logging),
			options: fullOptions,
			requests: new DataStat(),
			webSockets: {
				opened: new DataStat(),
				messages: {
					incoming: new DataStat(),
					outgoing: new DataStat()
				}
			}, classContexts: {
				http: mergeClasses(HttpRequest, ...this.middlewares.map((m) => m.data.classModifications.http)),
				wsConnect: mergeClasses(WsConnect, ...this.middlewares.map((m) => m.data.classModifications.http)),
				wsMessage: mergeClasses(WsMessage, ...this.middlewares.map((m) => m.data.classModifications.http)),
				wsClose: mergeClasses(WsClose, ...this.middlewares.map((m) => m.data.classModifications.http))
			}, defaults: {
				globContext,
				headers: {}
			}, middlewares: this.middlewares,
			data: {
				incoming: new DataStat(),
				outgoing: new DataStat()
			}, routes: {
				normal: [],
				websocket: [],
				static: [],

				htmlBuilder: []
			}, cache: {
				files: new ValueCollection(undefined, undefined, fullOptions.cache, fullOptions.cacheLimit),
				middlewares: new ValueCollection(undefined, undefined, fullOptions.cache, fullOptions.cacheLimit),
				routes: new ValueCollection(undefined, undefined, fullOptions.cache, fullOptions.cacheLimit)
			}
		}
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
	*/ public setOptions(
		/** The Options */ options: Options
	): this {
		this.globalContext.options = parseOptions(options)

		return this
	}

	/**
	 * Get OpenAPI 3.1 Defininitions for this Server (make sure to let all routes load before calling)
	 * @example
	 * ```
	 * const controller = new Server({ port: 4200 })
	 * 
	 * controller.path('/', (path) => path
	 *   .http('GET', '/openapi', (http) => http
	 *     .onRequest((ctr) => {
	 *       ctr.print(ctr.controller.getOpenApi3Def('http://localhost:4200'))
	 *     })
	 *   )
	 * )
	 * ```
	 * @since 7.6.0
	*/ public getOpenAPI3Def(serverUrl?: string): OpenAPIObject {
		return generateOpenAPI3(this.globalContext, serverUrl)
	}

	/**
	 * Route File Builder
	 * @example
	 * ```
	 * const { server } = require('../index.js')
	 * 
	 * module.exports = new server.routeFile((file) => file
	 *   .http(...)
	 * )
	 * ```
	 * @since 7.0.0
	*/ public routeFile: new (...args: ConstructorParameters<typeof RouteFile<GlobContext, Middlewares>>) => RouteFile<GlobContext, Middlewares> = RouteFile as any

	/**
	 * Start the Server
	 * @example
	 * ```
	 * const controller = new Server({ })
	 * 
	 * controller.start()
	 *   .then((port) => {
	 *     console.log(`Server started on port ${port}`)
	 *   })
	 *   .catch((err) => {
	 *     console.error(err)
	 *   })
	 * ```
	 * @since 3.0.0
	*/ public start(): Promise<number> {
		return new Promise(async(resolve, reject) => {
			let stopExecution = false
			const externalPaths = await this.loadExternalPaths()

			this.globalContext.webSockets = {
				opened: new DataStat(),
				messages: {
					incoming: new DataStat(),
					outgoing: new DataStat()
				}
			}; this.globalContext.data = {
				incoming: new DataStat(),
				outgoing: new DataStat()
			}; this.globalContext.requests = new DataStat()

			for (let middlewareIndex = 0; middlewareIndex < this.middlewares.length; middlewareIndex++) {
				const middleware = this.middlewares[middlewareIndex]
				if (!('data' in middleware)) {
					reject(new Error(`Middleware ${(middleware as any).name} is too old!`))
					stopExecution = true

					break
				}; if (!('initEvent' in middleware.data)) continue

				try {
					if (middleware.version !== currentVersion) throw new Error(`Middleware version cannot be higher or lower than currently supported version (${middleware.version} != ${currentVersion})`)
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
				.any('/*', (res, req) => { handleHTTPRequest(req, res, null, 'http', this.globalContext) })
				.ws('/*', {
					maxBackpressure: 512 * 1024 * 1024,
					sendPingsAutomatically: true,
					compression: this.globalContext.options.wsCompression.enabled ? uWebsocket.SHARED_COMPRESSOR : undefined,
					maxPayloadLength: this.globalContext.options.message.maxSize,
					upgrade: (res, req, connection) => { handleHTTPRequest(req, res, connection, 'upgrade', this.globalContext) },
					open: (ws: any) => { handleWSOpen(ws, this.globalContext) },
					message: this.globalContext.options.message.enabled ? (ws: any, message) => { handleWSMessage(ws, message, this.globalContext) } : undefined,
					close: (ws: any, code, message) => { handleWSClose(ws, message, this.globalContext) }
				})

			const routes = await this.getData()
			this.globalContext.routes.normal = routes.routes
			this.globalContext.routes.websocket = routes.webSockets
			this.globalContext.routes.static = routes.statics
			this.globalContext.contentTypes = routes.contentTypes
			this.globalContext.defaults.headers = routes.defaultHeaders

			this.globalContext.routes.normal.push(...externalPaths.routes)
			this.globalContext.routes.websocket.push(...externalPaths.webSockets)

			this.server.listen(this.globalContext.options.bind, this.globalContext.options.port, (listen) => {
				if (!listen) return reject(new Error(`Failed to start server on port ${this.globalContext.options.port}.`))

				this.socket = listen
				return resolve(uWebsocket.getSocketPort(listen))
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
	 *   .then((port) => {
	 *     console.log(`Server reloaded and started on port ${port}`)
	 *   })
	 *   .catch((err) => {
	 *     console.error(err)
	 *   })
	 * ```
	 * @since 3.0.0
	*/ public async reload(): Promise<number> {
		this.globalContext.cache.files.clear()
		this.globalContext.cache.routes.clear()

		const routes = await this.getData()
		this.globalContext.routes.normal = routes.routes
		this.globalContext.routes.websocket = routes.webSockets
		this.globalContext.routes.static = routes.statics
		this.globalContext.contentTypes = routes.contentTypes
		this.globalContext.defaults.headers = routes.defaultHeaders

		const externalPaths = await this.loadExternalPaths()
		this.globalContext.routes.normal.push(...externalPaths.routes)
		this.globalContext.routes.websocket.push(...externalPaths.webSockets)

		this.stop()
		return this.start()
	}

	/**
	 * Stop the Server
	 * @example
	 * ```
	 * const controller = new Server({ })
	 * 
	 * controller.stop()
	 *   .then(() => {
	 *     console.log('Server stopped')
	 *   })
	 *   .catch((err) => {
	 *     console.error(err)
	 *   })
	 * ```
	 * @since 3.0.0
	*/ public async stop(): Promise<void> {
		this.globalContext.cache.files.clear()
		this.globalContext.cache.routes.clear()
		uWebsocket.closeSocket(this.socket)

		return
	}


	/**
	 * Load all External Paths
	*/ private async loadExternalPaths() {
		const loadedRoutes: {
			routes: HTTP[]
			webSockets: WebSocket[]
		} = {
			routes: [],
			webSockets: []
		}

		for (const loadPath of (await this.getData()).loadPaths) {
			this.globalContext.logger.debug('Loading Route Path', loadPath)

			if (loadPath.type === 'cjs') {
				for (const file of (await getFilesRecursively(loadPath.path, true)).filter((f) => f.endsWith('js'))) {
					this.globalContext.logger.debug('Loading cjs Route file', file)

					const route: unknown = require(file)

					if (
						!route ||
						!(route instanceof RouteFile)
					) throw new Error(`Invalid Route @ ${file}`)

					const routeInfos = await route.getData(loadPath.prefix)

					for (const routeInfo of routeInfos.routes) {
						if (loadPath.fileBasedRouting) routeInfo.path.addSuffix(path.posix.normalize(path.posix.normalize(file).replace(path.posix.normalize(loadPath.path), '').replaceAll('\\', '/')).replace(/index|\.(js|ts|cjs|cts|mjs|mts)/g, ''))

						routeInfo.data.validations.push(...loadPath.validations)
						routeInfo.data.headers = Object.assign(routeInfo.data.headers, loadPath.headers)
					}

					for (const routeInfo of routeInfos.webSockets) {
						if (loadPath.fileBasedRouting) routeInfo.path.addSuffix(path.posix.normalize(path.posix.normalize(file).replace(path.posix.normalize(loadPath.path), '').replaceAll('\\', '/')).replace(/index|\.(js|ts|cjs|cts|mjs|mts)/g, ''))

						routeInfo.data.validations.push(...loadPath.validations)
					}

					loadedRoutes.routes.push(...routeInfos.routes)
					loadedRoutes.webSockets.push(...routeInfos.webSockets)
				}
			} else {
				for (const file of (await getFilesRecursively(loadPath.path, true)).filter((f) => f.endsWith('js'))) {
					this.globalContext.logger.debug('Loading esm Route file', file)

					const importFile = os.platform() === 'win32'
						? `file:///${file}`
						: file

					const route: unknown = (await import(importFile)).default

					if (
						!route ||
						!(route instanceof RouteFile)
					) throw new Error(`Invalid Route @ ${file}`)

					const routeInfos = await route.getData(loadPath.prefix)

					for (const routeInfo of routeInfos.routes) {
						if (loadPath.fileBasedRouting) routeInfo.path.addSuffix(path.posix.normalize(path.posix.normalize(file).replace(path.posix.normalize(loadPath.path), '').replaceAll('\\', '/')).replace(/index|\.(js|ts|cjs|cts|mjs|mts)/g, ''))

						routeInfo.data.validations.push(...loadPath.validations)
						routeInfo.data.headers = Object.assign(routeInfo.data.headers, loadPath.headers)
					}

					for (const routeInfo of routeInfos.webSockets) {
						if (loadPath.fileBasedRouting) routeInfo.path.addSuffix(path.posix.normalize(path.posix.normalize(file).replace(path.posix.normalize(loadPath.path), '').replaceAll('\\', '/')).replace(/index|\.(js|ts|cjs|cts|mjs|mts)/g, ''))

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