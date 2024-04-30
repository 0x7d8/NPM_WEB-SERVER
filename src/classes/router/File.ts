import Route from "@/classes/Route"
import parseURL from "@/functions/parseURL"
import { UsableMiddleware } from "@/classes/Middleware"
import { UsableValidator } from "@/classes/Validator"
import { RateLimitConfig } from "@/types/internal"
import RateLimit from "@/classes/router/RateLimit"
import path from "path"
import GlobalContext from "@/types/internal/classes/GlobalContext"
import { filesystem, object } from "@rjweb/utils"
import { OperationObject } from "openapi3-ts/oas31"
import Path from "@/classes/router/Path"
import deepClone from "@/functions/deepClone"

export default class File<Middlewares extends UsableMiddleware[], Validators extends UsableValidator[] = [], Context extends Record<string, any> = {}, Excluded extends (keyof File<Middlewares>)[] = []> {
	protected _httpRatelimit: RateLimitConfig
	protected _wsRatelimit: RateLimitConfig
	protected promises: Promise<any>[]
	protected openApi: OperationObject = {}
	private _global: GlobalContext
	private prefix: string

	private computePath(path: string | RegExp): string | RegExp {
		if (path instanceof RegExp) return path

		return parseURL(this.prefix.concat('/', path)).path
	}

	/**
	 * Create a new File Loader
	 * @since 9.0.0
	*/ constructor(prefix: string, global: GlobalContext, private validators: Validators = [] as never, ratelimits?: [RateLimitConfig, RateLimitConfig], promises?: Promise<any>[]) {
		this.prefix = prefix
		this._global = global

		if (ratelimits) {
			this._httpRatelimit = ratelimits[0]
			this._wsRatelimit = ratelimits[1]
		} else {
			this._httpRatelimit = new RateLimit()['data']
			this._wsRatelimit = new RateLimit()['data']
		}

		this.promises = promises ?? []
	}

	/**
	 * Add OpenAPI Documentation to all HTTP Endpoints in this Path (and all children)
	 * @since 9.0.0
	*/ public document(item: OperationObject): Omit<File<Middlewares, Validators, Context, [...Excluded, 'document']>, Excluded[number] | 'document'> {
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
	 * @since 9.0.0
	*/ public httpRatelimit(callback: (limit: RateLimit) => any): Omit<File<Middlewares, Validators, Context, Excluded>, Excluded[number] | 'httpRatelimit'> {
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
	 * @since 9.0.0
	*/ public wsRatelimit(callback: (limit: RateLimit) => any): Omit<File<Middlewares, Validators, Context, Excluded>, Excluded[number] | 'wsRatelimit'> {
		const limit = new RateLimit()
		limit['data'] = Object.assign({}, this._wsRatelimit)
		callback(limit)

		this._wsRatelimit = limit['data']

		return this as any
	}

	/**
	 * Use a Validator on all Endpoints in this Path
	 * 
	 * This will attach a Validator to all Endpoints in this Path
	 * @since 9.0.0
	*/ public validate<_Validator extends UsableValidator<any>>(validator: _Validator): File<Middlewares, [...Validators, _Validator], Context, Excluded> {
		this.validators.push(validator)
		this.openApi = object.deepMerge(this.openApi, validator.openApi)

		return this as any
	}

	/**
	 * Load Files from a Directory
	 * @since 9.0.0
	*/ public load(directory: string, options: {
		/**
		 * Function to filter which files get loaded
		 * @default (path) => path.endsWith('js')
		 * @since 9.0.0
		*/ filter?: (path: string) => boolean,
		/**
		 * Whether to use file based routing
		 * @default false
		 * @since 9.0.0
		*/ fileBasedRouting?: boolean
	} = {}): this {
		options = {
			filter: (path) => path.endsWith('js') || path.endsWith('ts'),
			fileBasedRouting: false,
			...options
		}

		this.promises.push(new Promise<void>(async(resolve) => {
			const resolved = path.resolve(directory)

			for await (const file of filesystem.walk(resolved, { recursive: true, async: true })) {
				if (!file.isFIFO() && !file.isFile()) continue
				if (!options.filter?.(file.path)) continue

				try {
					const { default: router } = await eval(`import(${JSON.stringify(file.path)})`), // bypass ttsc converting to require() in cjs
						path = file.path.replace(resolved, '').replaceAll('index', '').replace(/\\/g, '/').split('.').slice(0, -1).join('.').concat('/')

					if (router instanceof Path) {
						const modifiedRoutesHttp: Route<'http'>[] = [],
							modifiedRoutesWS: Route<'ws'>[] = [],
							modifiedRoutesStatic: Route<'static'>[] = []

						for (const route of router['routesHttp']) {
							route.validators.unshift(...this.validators)

							if (options.fileBasedRouting) {
								if (route.urlData.type === 'regexp') {
									route.urlData.prefix = this.computePath(path.concat(route.urlData.prefix)) as string
									route.openApi = deepClone(object.deepMerge(deepClone(this.openApi), route.openApi))

									modifiedRoutesHttp.push(route)
								} else {
									const newRoute = new Route('http', route['urlMethod'], this.computePath(path.concat(route.urlData.value)), route.data)
									newRoute.validators = route.validators
									newRoute.ratelimit = route.ratelimit
									newRoute.openApi = deepClone(object.deepMerge(deepClone(this.openApi), route.openApi))

									modifiedRoutesHttp.push(newRoute)
								}
							} else {
								modifiedRoutesHttp.push(route)
							}
						}

						for (const route of router['routesWS']) {
							route.validators.unshift(...this.validators)

							if (options.fileBasedRouting) {
								if (route.urlData.type === 'regexp') {
									route.urlData.prefix = this.computePath(path.concat(route.urlData.prefix)) as string
									route.openApi = deepClone(object.deepMerge(deepClone(this.openApi), route.openApi))

									modifiedRoutesWS.push(route)
								} else {
									const newRoute = new Route('ws', route['urlMethod'], this.computePath(path.concat(route.urlData.value)), route.data)
									newRoute.validators = route.validators
									newRoute.ratelimit = route.ratelimit
									newRoute.openApi = deepClone(object.deepMerge(deepClone(this.openApi), route.openApi))

									modifiedRoutesWS.push(newRoute)
								}
							} else {
								modifiedRoutesWS.push(route)
							}
						}

						for (const route of router['routesStatic']) {
							route.validators.unshift(...this.validators)

							if (options.fileBasedRouting) {
								if (route.urlData.type === 'regexp') {
									route.urlData.prefix = this.computePath(path.concat(route.urlData.prefix)) as string

									modifiedRoutesStatic.push(route)
								} else {
									const newRoute = new Route('static', route['urlMethod'], this.computePath(path.concat(route.urlData.value)), route.data)
									newRoute.validators = route.validators
									newRoute.ratelimit = route.ratelimit

									modifiedRoutesStatic.push(newRoute)
								}
							} else {
								modifiedRoutesStatic.push(route)
							}
						}

						this._global.routes.http.push(...modifiedRoutesHttp)
						this._global.routes.ws.push(...modifiedRoutesWS)
						this._global.routes.static.push(...modifiedRoutesStatic)
					} else {
						this._global.logger.error(`Failed to load route file ${file.path} (default export is not a Path)`)
					}
				} catch (err) {
					this._global.logger.error(`Failed to load route file ${file.path}\n${err}`)
				}
			}

			resolve()
		}))

		return this
	}

	/**
	 * Export the File Loader to be used in route files
	 * @since 9.0.0
	*/ public export(): {
		Path: new (prefix: string) => Path<Middlewares, Validators, Context>
	} {
		const self = this

		return {
			Path: class FakePath extends Path<Middlewares, Validators, Context> {
				constructor() {
					super('/', self._global, undefined, [self._httpRatelimit, self._wsRatelimit], self.promises)
				}
			}
		}
	}
}