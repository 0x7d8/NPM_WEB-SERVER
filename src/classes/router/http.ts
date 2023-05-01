import { isRegExp } from "util/types"
import { HTTPMethods, MiddlewareInitted, RoutedValidation } from "../../types/internal"
import HTTP from "../../types/http"

export default class RouteHTTP<Context extends Record<any, any> = {}, Body = unknown, Middlewares extends MiddlewareInitted[] = []> {
	private data: HTTP

	/** Generate HTTP Endpoint */
	constructor(
		/** The Path of the Routes */ path: string | RegExp,
		/** The Method to use */ method: HTTPMethods,
		/** The Validations to add */ validations: RoutedValidation[] = [],
		/** The Headers to add */ headers: Record<string, Buffer> = {}
	) {
		if (isRegExp(path)) {
			this.data = {
				type: 'route',
				method,
	
				path,
				pathStartWith: '/',
				onRequest: () => null,
				data: {
					validations,
					headers
				}, context: {
					data: {},
					keep: true
				}
			}
		} else {
			this.data = {
				type: 'route',
				method,
	
				path,
				pathArray: path.split('/'),
				onRequest: () => null,
				data: {
					validations,
					headers
				}, context: {
					data: {},
					keep: true
				}
			}
		}
	}

	/**
	 * Add a default State for the Request Context (which stays for the entire requests lifecycle)
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

		this.data.context.data = context
		this.data.context.keep = keepForever

		return this
	}

	/**
	 * Add a Context Handler for recieving HTTP Bodies
	 * @warning when using this, ctr.rawBody & ctr.body will always be empty
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
	 *   )
	 * )
	 * ```
	 * @since 6.0.0
	*/ public onRawBody(
		/** The Async Code to run when the Socket gets an Upgrade HTTP Request */ code: HTTP<Context, never, Middlewares>['onRawBody']
	): this {
		this.data.onRawBody = code as any

		return this
	}

	/**
	 * Add an Event when someone makes an HTTP request
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
		/** The Async Code to run when the Socket is Established */ code: HTTP<Context, Body, Middlewares>['onRequest']
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