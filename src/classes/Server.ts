import { BaseImplementation, Implementation } from "@/types/implementation"
import { Content, Method, ReverseProxyIps, ServerStatus } from "@/types/global"
import { FullServerOptions, ServerOptions } from "@/types/structures/ServerOptions"
import { as, network, number, object, size, time } from "@rjweb/utils"
import GlobalContext from "@/types/internal/classes/GlobalContext"
import ContentTypes from "@/classes/router/ContentTypes"
import { DataContext, EndFn, ErrorCallbacks, FinishCallbacks, RatelimitCallbacks, RealAny } from "@/types/internal"
import FileLoader from "@/classes/router/File"
import { UsableMiddleware, currentVersion } from "@/classes/Middleware"
import Validator from "@/classes/Validator"
import Path from "@/classes/router/Path"
import Route from "@/classes/Route"
import mergeClasses from "@/functions/mergeClasses"
import parseURL from "@/functions/parseURL"
import { oas31 } from "openapi3-ts"
import Channel from "@/classes/Channel"

import RequestContext from "@/types/internal/classes/RequestContext"

import httpHandler from "@/handlers/http"
import wsHandler from "@/handlers/ws"

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
	}, methods: {
		head: true,
		trace: false
	}
}

export default class Server<const Options extends ServerOptions, Middlewares extends UsableMiddleware[] = [], Context extends Record<string, any> = {}> {
	private options: FullServerOptions
	private middlewares: Middlewares
	private implementation: Implementation
	private _status: ServerStatus = 'stopped'
	private global: GlobalContext
	private promises: Promise<any>[] = []
	private interval: NodeJS.Timeout | null = null
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
	 * Grab a Channel from either a string identifier or a Channel object
	 * @example
	 * ```
	 * const channel = ctr.$channel('channel')
	 * 
	 * await channel.send('text', 'Ok')
	 * 
	 * // or
	 * 
	 * const ref = new Channel<string>()
	 * const channel = ctr.$channel(ref)
	 * 
	 * await channel.send('text', 'Ok')
	 * ```
	 * @since 9.8.1
	*/ public $channel<C extends Content = any>(channel: Channel<C> | string): Channel<C> {
		if (typeof channel === 'string') {
			const channelObj = this.context.global.internalChannelStringIdentifiers.get(channel)
			if (!channelObj) {
				this.context.global.internalChannelStringIdentifiers.set(channel, new Channel())
			}

			return channelObj || this.context.global.internalChannelStringIdentifiers.get(channel)!
		}

		return channel
	}

	/**
	 * Fetch (simulate) a request to the Server
	 * @since 9.3.0
	*/ public async fetch(path: string | URL, request?: RequestInit): ReturnType<typeof fetch> {
		if (this._status === 'stopped') throw new Error('Server is not listening')

		const v4 = this.options.bind.includes('.')

		const realUrl = new URL('http://host'.concat(parseURL(path instanceof URL ? path.pathname : path).href))

		realUrl.hostname = v4
			? this.options.bind === '0.0.0.0' ? '127.0.0.1' : this.options.bind
			: new network.IPAddress(this.options.bind).equals(new network.IPAddress('::')) ? '::1' : this.options.bind
		realUrl.port = this.port()?.toString() ?? '0'

		const identifier = number.generateCrypto(1, 1000000)
		this.global.internalRequestIdentifiers.add(identifier)

		return fetch(realUrl.href, Object.assign(request ?? {}, {
			headers: Object.assign(request?.headers ?? {}, {
				'rjweb-server-identifier': identifier
			})
		}))
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
	*/ public error<Key extends keyof ErrorCallbacks<Middlewares, Context>>(key: Key, callback: ErrorCallbacks<Middlewares, Context>[Key]): this {
		this.global.errorHandlers[key] = callback

		return this
	}

	/**
	 * Listen to Ratelimit Callbacks
	 * @since 9.0.0
	*/ public rateLimit<Key extends keyof RatelimitCallbacks<Middlewares, Context>>(key: Key, callback: RatelimitCallbacks<Middlewares, Context>[Key]): this {
		this.global.rateLimitHandlers[key] = callback

		return this
	}

	/**
	 * Listen to Handler Finish Callbacks
	 * @since 9.5.5
	*/ public finish<Key extends keyof FinishCallbacks<Middlewares, Context>>(key: Key, callback: FinishCallbacks<Middlewares, Context>[Key]): this {
		this.global.finishHandlers[key] = callback

		return this
	}

	/**
	 * Listen to Not Found Callbacks
	 * @since 9.0.0
	*/ public notFound(callback: (ctr: DataContext<'HttpRequest', 'GET', HttpRequestContext<Context>, Middlewares>) => RealAny): this {
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
	*/ public openAPI(name: string, version: string, server: oas31.ServerObject, contact?: oas31.ContactObject): oas31.OpenAPIObject {
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
				const openAPI = route['openApi']
				if (!Object.keys(openAPI).length) continue

				const parameters = []
				for (const parameter of openAPI.parameters ?? []) {
					if (!('name' in parameter)) {
						parameters.push(parameter)
						continue
					}

					if (parameters.find((p) => 'name' in p && p.name === parameter.name && p.in === parameter.in)) continue

					parameters.push(parameter)
				}

				openAPI.parameters = parameters
				pathItem[method.toLowerCase() as Lowercase<Exclude<Method, 'CONNECT'>>] = openAPI
			}

			if (Object.keys(pathItem).length) builder.addPath(path, pathItem)
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

				this.interval = setInterval(() => {
					this.global.logger.debug('Running 1min Interval ...')
					const intervalStartTime = performance.now()

					for (const [ key, { end } ] of this.global.rateLimits) {
						if (end < Date.now()) this.global.rateLimits.delete(key)
					}

					this.global.logger.debug(`Running 1min Interval ... Done ${(performance.now() - intervalStartTime).toFixed(2)}ms`)
				}, time(1).m())

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
	 * const server = new Server(...)
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
		if (this.interval) clearInterval(this.interval)
		this._status = 'stopped'

		return this
	}
}