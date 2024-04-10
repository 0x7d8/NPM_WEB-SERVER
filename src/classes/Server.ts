import { BaseImplementation, Implementation } from "@/types/implementation"
import { Method, ReverseProxyIps, ServerStatus } from "@/types/global"
import { FullServerOptions, ServerOptions } from "@/types/structures/ServerOptions"
import { as, object, size } from "@rjweb/utils"
import GlobalContext from "@/types/internal/classes/GlobalContext"
import ContentTypes from "@/classes/router/ContentTypes"
import { DataContext, EndFn, ErrorCallbacks, RatelimitCallbacks, RealAny } from "@/types/internal"
import FileLoader from "@/classes/router/File"
import { UsableMiddleware, currentVersion } from "@/classes/Middleware"
import Validator from "@/classes/Validator"
import Path from "@/classes/router/Path"
import Route from "@/classes/Route"
import mergeClasses from "@/functions/mergeClasses"
import { oas31 } from "openapi3-ts"

import httpHandler from "@/handlers/http"
import wsHandler from "@/handlers/ws"
import RequestContext from "@/types/internal/classes/RequestContext"

import HttpRequestContext from "@/classes/request/HttpRequestContext"
import WsOpenContext from "@/classes/request/WsOpenContext"
import WsMessageContext from "@/classes/request/WsMessageContext"
import WsCloseContext from "@/classes/request/WsCloseContext"

export const defaultOptions: FullServerOptions = {
	port: 0,
	bind: '0.0.0.0',
	version: true,
	compression: {
		http: {
			enabled: true,
			preferOrder: ['brotli', 'gzip', 'deflate'],
			maxSize: size(10).mb(),
			minSize: size(1).kb()
		}, ws: {
			enabled: true,
			maxSize: size(1).mb()
		}
	}, performance: {
		eTag: true,
		lastModified: true
	}, logging: {
		debug: false,
		error: true,
		warn: true
	}, proxy: {
		enabled: false,
		force: false,
		compress: false,
		header: 'x-forwarded-for',
		ips: {
			validate: false,
			mode: 'whitelist',
			list: [...ReverseProxyIps.LOCAL, ...ReverseProxyIps.CLOUDFLARE]
		}, credentials: {
			authenticate: false,
			username: 'proxy',
			password: 'proxy'
		}
	}
}

export default class Server<const Options extends ServerOptions, Middlewares extends UsableMiddleware[] = [], Context extends Record<string, any> = {}> {
	private options: FullServerOptions
	private middlewares: Middlewares
	private implementation: Implementation
	private _status: ServerStatus = 'stopped'
	private global: GlobalContext
	private promises: Promise<any>[] = []
	private openAPISchemas: Record<string, oas31.SchemaObject | oas31.ReferenceObject> = {}

	/**
	 * Construct a new Server Instance
	 * @example
	 * ```
	 * import { Server } from "rjweb-server"
	 * import { Runtime } from "@rjweb/runtime-bun"
	 * 
	 * const server = new Server(Runtime, {
	 *   port: 3000
	 * })
	 * ```
	 * @since 3.0.0
	*/ constructor(implementation: BaseImplementation, options: Options, middlewares?: Middlewares, private context: Context = {} as never) {
		this.middlewares = middlewares ?? [] as never

		this.options = object.deepParse(defaultOptions, options)

		this.implementation = new implementation(this.options)
		this.global = new GlobalContext(this.options, this.implementation, {
			HttpRequest: mergeClasses(HttpRequestContext, ...this.middlewares.filter((middleware) => middleware.rjwebVersion === currentVersion).map((middleware) => middleware.classContexts.HttpRequest(middleware.config, HttpRequestContext))),
			WsOpen: mergeClasses(WsOpenContext, ...this.middlewares.filter((middleware) => middleware.rjwebVersion === currentVersion).map((middleware) => middleware.classContexts.WsOpen(middleware.config, WsOpenContext))),
			WsMessage: mergeClasses(WsMessageContext, ...this.middlewares.filter((middleware) => middleware.rjwebVersion === currentVersion).map((middleware) => middleware.classContexts.WsMessage(middleware.config, WsMessageContext))),
			WsClose: mergeClasses(WsCloseContext, ...this.middlewares.filter((middleware) => middleware.rjwebVersion === currentVersion).map((middleware) => middleware.classContexts.WsClose(middleware.config, WsCloseContext)))
		})

		const outdated = this.middlewares.find((middleware) => middleware.rjwebVersion !== currentVersion)
		if (outdated) {
			throw new Error(`Middleware Version Mismatch\n  ${outdated.infos.name}: ${outdated.infos.version} (Recieved Middleware v${outdated.rjwebVersion}, expected v${currentVersion})`)
		}

		this.global.logger.debug('Server Created!')
		this.global.logger.debug('Implementation:')
		this.global.logger.debug(`  ${this.implementation.name()}: ${this.implementation.version()}`)
		this.global.logger.debug('Middlewares:')
		if (this.middlewares.length) {
			for (const middleware of this.middlewares) {
				this.global.logger.debug(`  ${middleware.infos.name}: ${middleware.infos.version}`)
			}
		} else {
			this.global.logger.debug('  (None)')
		}
	}

	/**
	 * Add a Content Type Mapping to override (or expand) content types
	 * @since 5.3.0
	*/ public contentTypes(callback: (builder: ContentTypes) => ContentTypes): this {
		const contentTypes = new ContentTypes()
		callback(contentTypes)

		this.global.contentTypes.import(contentTypes['data'])

		return this
	}


	public Validator: new <Data extends Record<string, any>>(...args: ConstructorParameters<typeof Validator<Data, Context, Middlewares>>) => Validator<Data, Context, Middlewares> = Validator
	public get FileLoader(): new (prefix: string) => FileLoader<Middlewares, [], Context> {
		const global = this.global,
			promises = this.promises

		return class FakeFileLoader extends FileLoader<Middlewares, [], Context> {
			constructor(prefix: string) {
				super(prefix, global, undefined, undefined, promises)
			}
		}
	}


	/**
	 * Listen to Error Callbacks
	 * @since 9.0.0
	*/ public error<Key extends keyof ErrorCallbacks<Middlewares>>(key: Key, callback: ErrorCallbacks<Middlewares>[Key]): this {
		this.global.errorHandlers[key] = callback

		return this
	}

	/**
	 * Listen to Ratelimit Callbacks
	 * @since 9.0.0
	*/ public rateLimit<Key extends keyof RatelimitCallbacks<Middlewares>>(key: Key, callback: RatelimitCallbacks<Middlewares>[Key]): this {
		this.global.rateLimitHandlers[key] = callback

		return this
	}

	/**
	 * Listen to Not Found Callbacks
	 * @since 9.0.0
	*/ public notFound(callback: (ctr: DataContext<'HttpRequest', 'GET', HttpRequestContext<GlobalContext>, Middlewares>) => RealAny): this {
		this.global.notFoundHandler = callback as any

		return this
	}

	/**
	 * Create a new Path
	 * @since 6.0.0
	*/ public path(prefix: string, callback: (path: Path<Middlewares, [], Context>) => any): this {
		const path = new Path<Middlewares, [], Context>(prefix, this.global, undefined, undefined, this.promises)
		callback(path)

		this.global.routes.http.push(...path['routesHttp'])
		this.global.routes.static.push(...path['routesStatic'])
		this.global.routes.ws.push(...path['routesWS'])

		return this
	}

	/**
	 * Listen to all HTTP Requests (does not override routed ones)
	 * @since 9.0.0
	*/ public http(callback: (ctr: DataContext<'HttpRequest', 'GET', HttpRequestContext<Context>, Middlewares>, end: EndFn) => RealAny): this {
		this.global.httpHandler = callback as any

		return this
	}

	/**
	 * Generate an OpenAPI Specification for the Server
	 * @since 9.0.0
	*/ public openAPI(name: string, version: string, server: oas31.ServerObject, contact?: oas31.ContactObject): oas31.SchemaObject {
		const builder = new oas31.OpenApiBuilder()
			.addTitle(name)
			.addVersion(version)
			.addServer(server)

		if (contact) builder.addContact(contact)

		const routes: Record<string, Record<Exclude<Method, 'CONNECT'>, Route<'http'>>> = {}
		for (const route of this.global.routes.http) {
			if (route.urlData.type === 'regexp') continue

			if (!routes[route.urlData.value]) routes[route.urlData.value] = {} as never
			if (route['urlMethod'] === 'CONNECT') continue

			routes[route.urlData.value][route['urlMethod']] = route
		}

		for (const path in routes) {
			const pathItem: oas31.PathItemObject = {}

			for (const [ method, route ] of Object.entries(routes[path])) {
				pathItem[method.toLowerCase() as Lowercase<Exclude<Method, 'CONNECT'>>] = route['openApi']
			}

			builder.addPath(path, pathItem)
		}

		for (const schema in this.openAPISchemas) {
			builder.addSchema(schema, this.openAPISchemas[schema])
		}

		return builder.rootDoc
	}

	/**
	 * Add an OpenAPI Schema to the Server
	 * @since 9.0.0
	*/ public schema(name: string, schema: oas31.SchemaObject | oas31.ReferenceObject): this {
		this.openAPISchemas[name] = schema

		return this
	}

	/**
	 * Get the Server's Port that its listening on
	 * @since 9.0.0
	*/ public port(): (Options extends { port: number } ? Options['port'] extends 0 ? number : Options['port'] : number) | null {
		if (this._status === 'stopped') return null

		return as<any>(this.implementation.port())
	}

	/**
	 * Get the Server's Status
	 * @since 9.0.0
	*/ public status(): ServerStatus {
		return this._status
	}

	/**
	 * Start the Server Instance
	 * @example
	 * ```
	 * import { Server } from "rjweb-server"
	 * 
	 * const server = new Server({})
	 * 
	 * server.start().then((port) => {
	 *   console.log(`Server Started on Port ${port}`)
	 * })
	 * ```
	 * @since 3.0.0
	*/ public start(): Promise<number> {
		if (this._status === 'listening') throw new Error('Server is already listening')

		this.implementation.handle({
			http: (context) => httpHandler(new RequestContext(context, this.middlewares, this as any, this.global), context, this, this.middlewares, this.context),
			ws: (ws) => wsHandler(ws.data(), ws, this, this.middlewares)
		})

		return new Promise(async(resolve, reject) => {
			try {
				await this.implementation.start()
				this._status = 'listening'

				this.global.logger.debug('Running Router Promises ...')
				const promisesStartTime = performance.now()
				await Promise.all(this.promises)
				this.global.logger.debug(`Running Router Promises ... Done ${(performance.now() - promisesStartTime).toFixed(2)}ms`)
				this.global.logger.debug('Running Middleware Promises ...')
				const middlewareStartTime = performance.now()
				await Promise.all(this.middlewares.map((middleware) => middleware.callbacks.load?.(middleware.config, this as any, this.global)))
				this.global.logger.debug(`Running Middleware Promises ... Done ${(performance.now() - middlewareStartTime).toFixed(2)}ms`)

				resolve(this.implementation.port())
			} catch (err) {
				this.implementation.stop()
				this._status = 'stopped'

				reject(err)
			}
		})
	}

	/**
	 * Stop the Server Instance
	 * @example
	 * ```
	 * import { Server } from "rjweb-server"
	 * 
	 * const server = new Server({})
	 * 
	 * server.start().then((port) => {
	 *   console.log(`Server Started on Port ${port}`)
	 * 
	 *   setTimeout(() => {
	 *     server.stop()
	 *     console.log('Server Stopped after 5 seconds')
	 *   }, 5000)
	 * })
	 * ```
	 * @since 3.0.0
	*/ public stop(): this {
		if (this._status === 'stopped') throw new Error('Server is already stopped')

		this.implementation.stop()
		this._status = 'stopped'

		return this
	}
}