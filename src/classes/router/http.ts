import { HTTPMethods, RoutedValidation } from "../../types/internal"
import HTTP from "../../types/http"

export default class RouteHTTP<Context extends Record<any, any> = {}, Body = unknown> {
	private data: HTTP

	/** Generate HTTP Endpoint */
	constructor(
		/** The Path of the Routes */ path: string,
		/** The Method to use */ method: HTTPMethods,
		/** The Validations to add */ validations: RoutedValidation[] = [],
		/** The Headers to add */ headers: Record<string, Buffer> = {}
	) {
		this.data = {
			type: 'route',
			method,

			path,
			pathArray: path.split('/'),
			onRequest: () => null,
			data: {
				validations,
				headers
			}
		}
	}

	/**
	 * Add a Context Handler for recieving HTTP Bodies
	 * @warning when using this, ctr.rawBody & ctr.body will always be empty
	 * @ignore This has not been implemented fully yet
	 * @example
	 * ```
	 * const controller = new Server({ })
	 * 
	 * controller.path('/', (path) => path
	 *   .http('POST', '/hello', (http) => http
	 *     // The Context will be assigned to ctr['@']
	 *     .onRawBody((context, end, headers, chunk, isLast) => {
	 *       context.chunkCount = context.chunkCount + 1 || 1
	 * 
	 *       console.log(`Recieved Chunk, isLast: ${isLast}`, chunk)
	 *       if (context.chunkCount > 10) end() // This stops recieving chunks and will continue to http
	 *     })
	 *   )
	 * )
	 * ```
	 * @since 6.0.0
	*/ onRawBody(
		/** The Async Code to run when the Socket gets an Upgrade HTTP Request */ code: HTTP<Context>['onRawBody']
	) {
		this.data.onRawBody = code

		return this
	}

	/**
	 * Add an Event when someone makes an HTTP request
	 * @example
	 * ```
	 * const controller = new Server({ })
	 * 
	 * controller.path('/', (path) => path
	 *   .http('GET', '/ws', (ws) => ws
	 *     .onConnect((ctr) => {
	 *       console.log('Connected to Client')
	 *     })
	 *   )
	 * )
	 * ```
	 * @since 6.0.0
	*/ onRequest(
		/** The Async Code to run when the Socket is Established */ code: HTTP<Context, Body>['onRequest']
	) {
		this.data.onRequest = code

		return this
	}


	/**
	 * Internal Method for Generating Route Object
	 * @since 6.0.0
	*/ getData() {
		return {
			routes: [this.data]
		}
	}
}