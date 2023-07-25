import { HTTPMethods, MiddlewareInitted, RoutedValidation, ExcludeFrom } from "../../types/internal"
import HTTP from "../../types/http"
import RPath from "../path"
import DocumentationBuilder from "../documentation/builder"
import { as } from "rjutils-collection"
import RouteRateLimit from "./rateLimit"

export default class RouteHTTP<GlobContext extends Record<any, any> = {}, Context extends Record<any, any> = {}, Body = unknown, Middlewares extends MiddlewareInitted[] = [], Path extends string = '/', Excluded extends (keyof RouteHTTP)[] = []> {
	private data: HTTP

	/** Generate HTTP Endpoint */
	constructor(
		/** The Path of the Routes */ path: Path | RegExp,
		/** The Method to use */ method: HTTPMethods,
		/** The Validations to add */ validations: RoutedValidation[] = [],
		/** The Headers to add */ headers: Record<string, Buffer> = {},
		/** The Ratelimit to apply */ ratelimit: RouteRateLimit['data']
	) {
		this.data = {
			type: 'http',
			method,
	
			path: new RPath(method, path),
			onRequest: () => null,
			documentation: new DocumentationBuilder(),
			data: {
				ratelimit,
				validations,
				headers
			}, context: { data: {}, keep: true }
		}
	}

	/**
	 * Add a default State for the Request Context (which stays for the entire requests lifecycle)
	 * 
	 * This will set the default context for the request. This applies to all callbacks
	 * attached to this handler. When `keepForever` is enabled, the context will be shared
	 * between requests to this callback and therefore will be globally mutable. This may be
	 * useful for something like a request counter so you dont have to worry about transferring
	 * it around.
	 * @example
	 * ```
	 * const controller = new Server({ })
	 * 
	 * controller.path('/', (path) => path
	 *   .http('GET', '/context', (ws) => ws
	 *     .context({
	 *       text: 'hello world'
	 *     }, {
	 *       keepForever: true // If enabled this Context will be used & kept for every request on this route, so if you change something in it it will stay for the next time this request runs
	 *     })
	 *     .onRequest((ctr) => {
	 *       ctr.print(ctr["@"].text)
	 *     })
	 *   )
	 * )
	 * ```
	 * @since 7.0.0
	*/ public context(
		/** The Default State of the Request Context */ context: Context,
		/** The Options for this Function */ options: {
			/**
			 * Whether to keep the Data for the entirety of the Processes Lifetime
			 * @default false
			 * @since 7.0.0
			*/ keepForever?: boolean
		} = {}
	): ExcludeFrom<RouteHTTP<GlobContext, Context, Body, Middlewares, Path, [...Excluded, 'context']>, [...Excluded, 'context']> {
		const keepForever = options?.keepForever ?? false

		this.data.context = {
			data: context,
			keep: keepForever
		}

		return as<any>(this)
	}

	/**
	 * Add a Ratelimit to this Endpoint
	 * 
	 * When a User requests this Endpoint, that will count against their hit count, if
	 * the hits exceeds the `<maxHits>` in `<timeWindow>ms`, they wont be able to access
	 * the route for `<penalty>ms`.
	 * @example
	 * ```
	 * const { time } = require("rjutils-collection")
	 * const controller = new Server({ })
	 * 
	 * controller.path('/', (path) => path
	 *   .httpRateLimit((limit) => limit
	 *     .hits(5)
	 *     .timeWindow(time(20).s())
	 *     .penalty(0)
	 *   ) // This will allow 5 requests every 20 seconds
	 *   .http('GET', '/hello', (ws) => ws
	 *     .onRequest(async(ctr) => {
	 *       ctr.print('Hello bro!')
	 *     })
	 *   )
	 * )
	 * 
	 * controller.on('httpRatelimit', (ctr) => {
	 *   ctr.print(`Please wait ${ctr.getRateLimit()?.resetIn}ms!!!!!`)
	 * })
	 * ```
	 * @since 8.6.0
	*/ public ratelimit(
		callback: (limit: RouteRateLimit) => RouteRateLimit
	): ExcludeFrom<RouteHTTP<GlobContext, Context, Body, Middlewares, Path, [...Excluded, 'ratelimit']>, [...Excluded, 'ratelimit']> {
		const limit = new RouteRateLimit()
		limit['data'] = Object.assign({}, this.data.data.ratelimit)

		callback(limit)

		this.data.data.ratelimit = limit['data']

		return as<any>(this)
	}

	/**
	 * Add additional OpenAPI 3 Documentation to this Endpoint
	 * 
	 * This will append additional OpenAPI 3 Documentation Infos to this endpoint when calling
	 * the `<Server>.getOpenAPI3Def()` Method. This is useful for preventing API documentation
	 * duplication, making an endpoint for the `<Server>.getOpenAPI3Def()` Method that the frontend
	 * can access would help with that.
	 * @example
	 * ```
	 * const controller = new Server({ })
	 * 
	 * controller.path('/', (path) => path
	 *   .http('GET', '/wait', (http) => http
	 *     .document((docs) => docs
	 *       .queries((queries) => queries
	 *         .add('duration', (key) => key
	 *           .description('The Duration in Seconds for waiting')
	 *           .required()
	 *         )
	 *       )
	 *     )
	 *     .onRequest(async(ctr) => {
	 *       if (!ctr.queries.has('duration'))) return ctr.status((s) => s.BAD_REQUEST).print('Missing the Duration query...')
	 * 
	 *       await new Promise((r) => setTimeout(r, Number(ctr.queries.get('duration')) * 1000))
	 *       return ctr.print(`waited ${ctr.queries.get('duration')} seconds`)
	 *     })
	 *   )
	 * )
	 * ```
	 * @since 8.5.0
	*/ public document(
		/** The Callback to handle defining the Documentation */ callback: (builder: DocumentationBuilder) => any
	): ExcludeFrom<RouteHTTP<GlobContext, Context, Body, Middlewares, Path, [...Excluded, 'document']>, [...Excluded, 'document']> {
		callback(this.data.documentation)

		return as<any>(this)
	}

	/**
	 * Attach a Callback for when the server recieves a HTTP body chunk
	 * 
	 * This will attach a callback for when the server receives an http POST body chunk, the
	 * request can always be ended by calling the 2nd function argument. Attaching this will
	 * cause `ctr.body`, `ctr.rawBody` and `ctr.rawBodyBytes` to be empty unless you manually
	 * assign them by doing `ctr.ctx.body.chunks.push(chunk)`.
	 * @warning when using this, `ctr.body`, `ctr.rawBody` and `ctr.rawBodyBytes` will always be empty
	 * @example
	 * ```
	 * const controller = new Server({ })
	 * 
	 * controller.path('/', (path) => path
	 *   .http('POST', '/hello', (http) => http
	 *     .context({
	 *       chunkCount: 0
	 *     })
	 *     .onRawBody((ctr, end, chunk, isLast) => {
	 *       ctr["@"].chunkCount++
	 * 
	 *       console.log(`Recieved Chunk, isLast: ${isLast}`, chunk)
	 *       if (ctr["@"].chunkCount > 10) end() // This stops recieving chunks and will continue to http
	 *     })
	 *     .onRequest((ctr) => {
	 *       ctr.print(`I received ${ctr["@"].chunkCount} chunks!`)
	 *       if (ctr["@"].chunkCount === 10) ctr.printPart(' You reached the maximum allowed!')
	 *     })
	 *   )
	 * )
	 * ```
	 * @since 6.0.0
	*/ public onRawBody(
		/** The Async Callback to run when the Socket gets an Upgrade HTTP Request */ callback: HTTP<GlobContext & Context, never, Middlewares, Path>['onRawBody']
	): ExcludeFrom<RouteHTTP<GlobContext, Context, Body, Middlewares, Path, [...Excluded, 'onRawBody']>, [...Excluded, 'onRawBody']> {
		this.data.onRawBody = callback as any

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
	 * const controller = new Server({ })
	 * 
	 * controller.path('/', (path) => path
	 *   .http('GET', '/hello', (ws) => ws
	 *     .onRequest((ctr) => {
	 *       ctr.print('Hello')
	 *     })
	 *   )
	 * )
	 * ```
	 * @since 6.0.0
	*/ public onRequest(
		/** The Async Callback to run when the Socket is Established */ callback: HTTP<GlobContext & Context, Body, Middlewares, Path>['onRequest']
	): ExcludeFrom<RouteHTTP<GlobContext, Context, Body, Middlewares, Path, [...Excluded, 'onRequest']>, [...Excluded, 'onRequest']> {
		this.data.onRequest = callback as any

		return as<any>(this)
	}


	/**
	 * Internal Method for Generating Route Object
	 * @since 6.0.0
	*/ public getData(prefix: string) {
		this.data.path.addPrefix(prefix)

		return {
			routes: [this.data]
		}
	}
}