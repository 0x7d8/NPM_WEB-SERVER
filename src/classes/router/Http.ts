import Route from "@/classes/Route"
import { Method } from "@/types/global"
import RateLimit from "@/classes/router/RateLimit"
import { as, object } from "@rjweb/utils"
import { UsableMiddleware } from "@/classes/Middleware"
import { UsableValidator } from "@/classes/Validator"
import { DataContext, RateLimitConfig, RealAny, UnionToIntersection } from "@/types/internal"
import HttpRequestContext from "@/classes/request/HttpRequestContext"
import { oas31 } from "openapi3-ts"
import deepClone from "@/functions/deepClone"

export default class Http<_Method extends Method, Middlewares extends UsableMiddleware[] = [], Validators extends UsableValidator[] = [], Context extends Record<string, any> = {}, Excluded extends (keyof Http<_Method>)[] = []> {
	protected route: Route<'http'>

	/**
	 * Create a new HTTP Route Builder
	 * @since 7.0.0
	*/ constructor(method: _Method, path: string | RegExp, ratelimit?: RateLimitConfig | null) {
		this.route = new Route('http', method, path, {})
		if (ratelimit) this.route.ratelimit = ratelimit
	}

	/**
	 * Add OpenAPI Documentation to all HTTP Endpoints in this Path (and all children)
	 * @since 9.0.0
	*/ public document(item: oas31.OperationObject): Omit<Http<_Method, Middlewares, Validators, Context, [...Excluded, 'document']>, Excluded[number] | 'document'> {
		this.route.openApi = object.deepMerge(this.route.openApi, item)

		return this as any
	}

	/**
	 * Add a Ratelimit to this Endpoint
	 * 
	 * When a User requests this Endpoint, that will count against their hit count, if
	 * the hits exceeds the `<maxHits>` in `<timeWindow>ms`, they wont be able to access
	 * the route for `<penalty>ms`.
	 * @example
	 * ```
	 * import { time } from "@rjweb/utils"
	 * const server = new Server(...)
	 * 
	 * server.path('/', (path) => path
	 *   .http('GET', '/hello', (ws) => ws
	 *     .ratelimit((limit) => limit
	 *       .hits(5)
	 *       .timeWindow(time(20).s())
	 *       .penalty(0)
	 *     ) // This will allow 5 requests every 20 seconds
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
	*/ public ratelimit(callback: (limit: RateLimit) => any): Omit<Http<_Method, Middlewares, Validators, Context, [...Excluded, 'ratelimit']>, Excluded[number] | 'ratelimit'> {
		const limit = new RateLimit()
		if (this.route.ratelimit) limit['data'] = Object.assign({}, this.route.ratelimit)
		callback(limit)

		this.route.ratelimit = limit['data']

		return as<any>(this)
	}

	/**
	 * Add additional Context to this Endpoint
	 * 
	 * This will add additional context to this Endpoint, which will be available in the
	 * `ctr` object when the Endpoint is executed.
	 * @since 7.0.0
	*/ public context<_Context extends Record<string, any>>(): Omit<Http<_Method, Middlewares, Validators, Context & _Context, [...Excluded, 'context']>, Excluded[number] | 'context'> {
		return as<any>(this)
	}

	/**
	 * Use a Validator on this Endpoint
	 * 
	 * This will attach a Validator to this Endpoint, which will be run before the
	 * Endpoint is executed. If the Validator fails, the Endpoint will not be executed.
	 * @since 9.0.0
	*/ public validate<_Validator extends UsableValidator<any>>(validator: _Validator): Http<_Method, Middlewares, [...Validators, _Validator], Context, Excluded> {
		this.route.validators.push(validator)
		this.route.openApi = object.deepMerge(this.route.openApi, deepClone(validator.openApi))

		return as<any>(this)
	}

	/**
	 * Attach a Callback for when someone makes an HTTP request
	 * 
	 * This will attach a callback for when the server recieves a http request and
	 * finishes parsing it for the user. This Handler should always be set unless you
	 * are reserving a path for later or something.
	 * @example
	 * ```
	 * const server = new Server(...)
	 * 
	 * server.path('/', (path) => path
	 *   .http('GET', '/hello', (http) => http
	 *     .onRequest((ctr) => {
	 *       ctr.print('Hello')
	 *     })
	 *   )
	 * )
	 * ```
	 * @since 6.0.0
	*/ public onRequest(
		callback: (ctr: DataContext<'HttpRequest', _Method, HttpRequestContext<Context & UnionToIntersection<Validators[number]['context']>>, Middlewares>) => RealAny
	): Omit<Http<_Method, Middlewares, Validators, Context, [...Excluded, 'onRequest']>, Excluded[number] | 'onRequest'> {
		this.route.data.onRequest = callback as any

		return as<any>(this)
	}

	/**
	 * Attach a Callback for when the server recieves a HTTP body chunk
	 * 
	 * This will attach a callback for when the server receives an http POST body chunk, the
	 * request can always be ended by calling the 2nd function argument. Attaching this will
	 * cause `ctr.body`, `ctr.rawBody` and `ctr.rawBodyBytes` to be empty unless you manually
	 * assign them by doing `ctr.context.body.chunks.push(chunk)`.
	 * @warning when using this, `ctr.body`, `ctr.rawBody` and `ctr.rawBodyBytes` will always be empty
	 * @example
	 * ```
	 * const server = new Server(...)
	 * 
	 * server.path('/', (path) => path
	 *   .http('POST', '/hello', (http) => http
	 *     .context<{
	 *       chunkCount: number
	 *     }>()
	 *     .onRawBody((ctr, end, chunk, isLast) => {
	 *       ctr["@"].chunkCount = (ctr["@"].chunkCount || 0) + 1
	 * 
	 *       console.log(`Recieved Chunk, isLast: ${isLast}`, chunk)
	 *       if (ctr["@"].chunkCount > 10) end(ctr.status(ctr.$status.BAD_REUQEST).print('too many chunks')) // This stops recieving chunks and will end the http request
	 *     })
	 *     .onRequest((ctr) => {
	 *       return ctr.print(`I received ${ctr["@"].chunkCount} chunks!`)
	 *     })
	 *   )
	 * )
	 * ```
	 * @since 6.0.0
	*/ public onRawBody(
		callback: (ctr: Omit<DataContext<'HttpRequest', _Method, HttpRequestContext<Context & UnionToIntersection<Validators[number]['context']>>, Middlewares>, 'yield'>, end: () => void, chunk: Buffer, isLast: boolean) => void
	): Omit<Http<_Method, Middlewares, Validators, Context, [...Excluded, 'onRawBody']>, Excluded[number] | 'onRawBody'>{
		this.route.data.onRawBody = callback as any

		return as<any>(this)
	}
}