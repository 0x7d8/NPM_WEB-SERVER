import { isRegExp } from "util/types"
import { HTTPMethods, MiddlewareInitted, RoutedValidation } from "../../types/internal"
import HTTP from "../../types/http"

export default class RouteHTTP<GlobContext extends Record<any, any> = {}, Context extends Record<any, any> = {}, Body = unknown, Middlewares extends MiddlewareInitted[] = [], Path extends string = '/'> {
	private data: HTTP

	/** Generate HTTP Endpoint */
	constructor(
		/** The Path of the Routes */ path: Path | RegExp,
		/** The Method to use */ method: HTTPMethods,
		/** The Validations to add */ validations: RoutedValidation[] = [],
		/** The Headers to add */ headers: Record<string, Buffer> = {}
	) {
		if (isRegExp(path)) {
			this.data = {
				type: 'http',
				method,
	
				path,
				pathStartWith: '/',
				onRequest: () => null,
				data: {
					validations,
					headers
				}, context: { data: {}, keep: true }
			}
		} else {
			this.data = {
				type: 'http',
				method,
	
				path,
				pathArray: path.split('/'),
				onRequest: () => null,
				data: {
					validations,
					headers
				}, context: { data: {}, keep: true }
			}
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
	): this {
		const keepForever = options?.keepForever ?? false

		this.data.context = {
			data: context,
			keep: keepForever
		}

		return this
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
		/** The Async Code to run when the Socket gets an Upgrade HTTP Request */ code: HTTP<GlobContext & Context, never, Middlewares, Path>['onRawBody']
	): this {
		this.data.onRawBody = code as any

		return this
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
		/** The Async Code to run when the Socket is Established */ code: HTTP<GlobContext & Context, Body, Middlewares, Path>['onRequest']
	): this {
		this.data.onRequest = code as any

		return this
	}


	/**
	 * Internal Method for Generating Route Object
	 * @since 6.0.0
	*/ public getData(prefix: string) {
		if (isRegExp(this.data.path) && 'pathStartWith' in this.data) this.data.pathStartWith = prefix

		return {
			routes: [this.data]
		}
	}
}