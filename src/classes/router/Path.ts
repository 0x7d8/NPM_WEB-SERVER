import Route from "@/classes/Route"
import { Method } from "@/types/global"
import Http from "@/classes/router/Http"
import parseURL from "@/functions/parseURL"
import { UsableMiddleware } from "@/classes/Middleware"
import { UsableValidator } from "@/classes/Validator"
import { RateLimitConfig } from "@/types/internal"
import RateLimit from "@/classes/router/RateLimit"
import path from "path"
import GlobalContext from "@/types/internal/classes/GlobalContext"
import { ArrayOrNot, filesystem, object } from "@rjweb/utils"
import Ws from "@/classes/router/Ws"
import { OperationObject } from "openapi3-ts/oas31"
import deepClone from "@/functions/deepClone"

export default class Path<Middlewares extends UsableMiddleware[], Validators extends UsableValidator[] = [], Context extends Record<string, any> = {}, Excluded extends (keyof Path<Middlewares>)[] = []> {
	protected routesHttp: Route<'http'>[] = []
	protected routesStatic: Route<'static'>[] = []
	protected routesWS: Route<'ws'>[] = []
	protected _httpRatelimit: RateLimitConfig | null
	protected _wsRatelimit: RateLimitConfig | null
	protected promises: Promise<any>[]
	protected openApi: OperationObject
	private _global: GlobalContext
	private prefix: string

	private computePath(path: string | RegExp): string | RegExp {
		if (path instanceof RegExp) return path

		return parseURL(this.prefix.concat('/', path)).path
	}

	/**
	 * Create a new Path
	 * @since 6.0.0
	*/ constructor(prefix: string, global: GlobalContext, private validators: Validators = [] as never, ratelimits?: [RateLimitConfig | null, RateLimitConfig | null], promises?: Promise<any>[], openApi?: OperationObject) {
		this.prefix = prefix
		this._global = global

		if (ratelimits) {
			this._httpRatelimit = ratelimits[0]
			this._wsRatelimit = ratelimits[1]
		} else {
			this._httpRatelimit = null
			this._wsRatelimit = null
		}

		this.promises = promises ?? []
		this.openApi = openApi ?? {}
	}

	/**
	 * Add OpenAPI Documentation to all HTTP Endpoints in this Path (and all children)
	 * @since 9.0.0
	*/ public document(item: OperationObject): Omit<Path<Middlewares, Validators, Context, [...Excluded, 'document']>, Excluded[number] | 'document'> {
		this.openApi = object.deepMerge(this.openApi, item)

		return this as any
	}

	/**
	 * Add a Ratelimit to all HTTP Endpoints in this Path (and all children)
	 * 
	 * When a User requests an Endpoint, that will count against their hit count, if
	 * the hits exceeds the `<maxHits>` in `<timeWindow>ms`, they wont be able to access
	 * the route for `<penalty>ms`.
	 * @example
	 * ```
	 * import { time } from "@rjweb/utils"
	 * 
	 * server.path('/', (path) => path
	 *   .httpRateLimit((limit) => limit
	 *     .hits(5)
	 *     .window(time(20).s())
	 *     .penalty(0)
	 *   ) // This will allow 5 requests every 20 seconds
	 *   .http('GET', '/hello', (ws) => ws
	 *     .onRequest(async(ctr) => {
	 *       ctr.print('Hello bro!')
	 *     })
	 *   )
	 * )
	 * 
	 * server.rateLimit('httpRequest', (ctr) => {
	 *   ctr.print(`Please wait ${ctr.getRateLimit()?.resetIn}ms!!!!!`)
	 * })
	 * ```
	 * @since 8.6.0
	*/ public httpRatelimit(callback: (limit: RateLimit) => any): Omit<Path<Middlewares, Validators, Context, Excluded>, Excluded[number] | 'httpRatelimit'> {
		const limit = new RateLimit()
		limit['data'] = Object.assign({}, this._httpRatelimit)
		callback(limit)

		this._httpRatelimit = limit['data']

		return this as any
	}

	/**
	 * Add a Ratelimit to all WebSocket Endpoints in this Path (and all children)
	 * 
	 * When a User sends a message to a Socket, that will count against their hit count, if
	 * the hits exceeds the `<maxHits>` in `<timeWindow>ms`, they wont be able to access
	 * the route for `<penalty>ms`.
	 * @example
	 * ```
	 * import { time } from "@rjweb/utils"
	 * 
	 * server.path('/', (path) => path
	 *   .httpRateLimit((limit) => limit
	 *     .hits(5)
	 *     .window(time(20).s())
	 *     .penalty(0)
	 *   ) // This will allow 5 messages every 20 seconds
	 *   .ws('/echo', (ws) => ws
	 *     .onMessage(async(ctr) => {
	 *       ctr.print(await ctr.rawMessageBytes())
	 *     })
	 *   )
	 * )
	 * 
	 * server.rateLimit('wsMessage', (ctr) => {
	 *   ctr.print(`Please wait ${ctr.getRateLimit()?.resetIn}ms!!!!!`)
	 * })
	 * ```
	 * @since 8.6.0
	*/ public wsRatelimit(callback: (limit: RateLimit) => any): Omit<Path<Middlewares, Validators, Context, Excluded>, Excluded[number] | 'wsRatelimit'> {
		const limit = new RateLimit()
		limit['data'] = Object.assign({}, this._wsRatelimit)
		callback(limit)

		this._wsRatelimit = limit['data']

		return this as any
	}

	/**
	 * Create a redirection route
	 * @example
	 * ```
	 * const server = new Server(...)
	 * 
	 * server.path('/', (path) => path
	 *   .redirect('/google', 'https://google.com')
	 * )
	 * ```
	 * @since 3.10.0
	*/ public redirect(path: ArrayOrNot<string | RegExp>, redirect: string, type?: 'temporary' | 'permanent'): this {
		for (const p of Array.isArray(path) ? path : [path]) {
			const route = new Route('http', 'GET', this.computePath(p), {
				onRequest(ctr) {
					return ctr.redirect(redirect, type)
				}
			})

			route.validators.unshift(...this.validators)
			this.routesHttp.push(route)
		}

		return this
	}

	/**
	 * Create a subpath of this Path
	 * @since 6.0.0
	*/ public path(prefix: string, callback: (path: Path<Middlewares, Validators, Context>) => any): this {
		const path = new Path<Middlewares, Validators, Context>(this.prefix.concat('/', prefix), this._global, [...this.validators] as any, [this._httpRatelimit, this._wsRatelimit], this.promises, deepClone(this.openApi))
		callback(path)

		this.routesHttp.push(...path.routesHttp)
		this.routesStatic.push(...path.routesStatic)
		this.routesWS.push(...path.routesWS)

		return this
	}

	/**
	 * Use a Validator on all Endpoints in this Path
	 * 
	 * This will attach a Validator to all Endpoints in this Path
	 * @since 9.0.0
	*/ public validate<_Validator extends UsableValidator<any>>(validator: _Validator): Path<Middlewares, [...Validators, _Validator], Context, Excluded> {
		this.validators.push(validator)
		this.openApi = object.deepMerge(this.openApi, deepClone(validator.openApi))

		return this as any
	}

	/**
	 * Serve Static Files
	 * @example
	 * ```
	 * // All Files in "./public" will be served dynamically so they wont be loaded as routes by default
	 * // Due to the stripHtmlEnding Option being on files will be served differently, /index.html -> /; /about.html -> /about; /contributors/index.html -> /contributors
	 * const server = new Server(...)
	 * 
	 * server.path('/', (path) => path
	 *   .static('./public', {
	 *     stripHtmlEnding: true // If enabled will remove .html ending from files
	 *   })
	 * )
	 * ```
	 * @since 3.1.0
	*/ public static(
		folder: string,
		options: {
			/**
			 * Whether to automatically remove .html ending from files
			 * @default false
			 * @since 9.0.0
			*/ stripHtmlEnding?: boolean
			/**
			 * Whether to pre-process the files before serving them,
			 * this will force you to restart the server every time
			 * you add or remove a file.
			 * @warning THIS WILL RECURSIVELY WALK THROUGH ALL FILES IN THE FOLDER, USE WITH CAUTION
			 * @default false
			 * @since 9.0.0
			*/ preProcessFiles?: boolean
		} = {}
	): this {
		const route = new Route('static', 'GET', this.computePath('/'), {
			folder: path.posix.resolve(folder),
			stripHtmlEnding: options.stripHtmlEnding ?? false
		})

		route.validators.unshift(...this.validators)
		this.routesStatic.push(route)

		if (options.preProcessFiles) {
			this.promises.push(new Promise<void>(async(resolve) => {
				for await (const file of filesystem.walk(route.data.folder, { async: true, recursive: true })) {
					if (file.isDirectory() || !file.path) continue

					const $path = path.posix.relative(route.data.folder, file.path).replace('./', '')

					if (!route.data.stripHtmlEnding) {
						this._global.cache.staticFiles.set(this.computePath($path).toString(), [path.posix.resolve(file.path), route])
					} else {
						{ // path/index.html
							if (file.name.endsWith('index.html')) {
								this._global.cache.staticFiles.set(this.computePath($path.replace('index.html', '')).toString(), [path.posix.resolve(file.path), route])
							}
						}

						{ // path.html
							if (file.name.endsWith('.html')) {
								this._global.cache.staticFiles.set(this.computePath($path.replace('.html', '')).toString(), [path.posix.resolve(file.path), route])
							}
						}

						{ // path
							this._global.cache.staticFiles.set(this.computePath($path).toString(), [path.posix.resolve(file.path), route])
						}
					}
				}

				resolve()
			}))
		}

		return this
	} 

	/**
	 * Add a new HTTP Route
	 * @example
	 * ```
	 * const server = new Server(...)
	 * 
	 * server.path('/', (path) => path
	 *   .http('GET', '/hello', (ws) => ws
	 *     .onRequest((ctr) => {
	 *       ctr.print('Hello!')
	 *     })
	 *   )
	 * )
	 * ```
	 * @since 6.0.0
	*/ public http<_Method extends Method>(method: _Method, path: ArrayOrNot<string | RegExp>, callback: (http: Http<_Method, Middlewares, Validators, Context>) => any): this {
		for (const p of Array.isArray(path) ? path : [path]) {
			const http = new Http<_Method, Middlewares, Validators, Context>(method, this.computePath(p), this._httpRatelimit)
			http['route'].openApi = deepClone(this.openApi)

			callback(http)

			const url = http['route'].urlData
			if (url.type === 'regexp') url.prefix = this.computePath('/').toString()

			http['route'].validators.unshift(...this.validators)
			this.routesHttp.push(http['route'])
		}

		return this
	}

	/**
	 * Add a new WebSocket Route
	 * @example
	 * ```
	 * const server = new Server(...)
	 * 
	 * server.path('/', (path) => path
	 *   .ws('/echo', (ws) => ws
	 *     .onMessage((ctr) => {
	 *       ctr.print(ctr.rawMessageBytes())
	 *     })
	 *   )
	 * )
	 * ```
	 * @since 6.0.0
	*/ public ws(path: ArrayOrNot<string | RegExp>, callback: (ws: Ws<Middlewares, Validators, Context>) => any): this {
		for (const p of Array.isArray(path) ? path : [path]) {
			const ws = new Ws<Middlewares, Validators, Context>(this.computePath(p), this._wsRatelimit)
			ws['route'].openApi = deepClone(this.openApi)

			callback(ws)

			const url = ws['route'].urlData
			if (url.type === 'regexp') url.prefix = this.computePath('/').toString()

			ws['route'].validators.unshift(...this.validators)
			this.routesWS.push(ws['route'])
		}

		return this
	}
}