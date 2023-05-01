import { isRegExp } from "util/types"
import { MiddlewareInitted, RoutedValidation } from "../../types/internal"
import WebSocket from "../../types/webSocket"

export default class RouteWS<Context extends Record<any, any> = {}, Message = unknown, Middlewares extends MiddlewareInitted[] = []> {
	private data: WebSocket

	/** Generate WS Endpoint */
	constructor(
		/** The Path of the Routes */ path: string | RegExp,
		/** The Validations to add */ validations: RoutedValidation[] = []
	) {
		if (isRegExp(path)) {
			this.data = {
				type: 'websocket',

				path,
				pathStartWith: '/',
				data: {
					validations
				}, context: {
					data: {},
					keep: true
				}
			}
		} else {
			this.data = {
				type: 'websocket',
	
				path,
				pathArray: path.split('/'),
				data: {
					validations
				}, context: {
					data: {},
					keep: true
				}
			}	
		}
	}

	/**
	 * Add a default State for the Request Context (which stays for the entire requests / websockets lifecycle)
	 * @example
	 * ```
	 * const controller = new Server({ })
	 * 
	 * controller.path('/', (path) => path
	 *   .ws('GET', '/ws', (ws) => ws
	 *     .context({
	 *       text: 'hello world'
	 *     }, {
	 *       keepForever: true // If enabled this Context will be used & kept for every request on this route, so if you change something in it it will stay for the next time this request runs
	 *     })
	 *     .onConnect((ctr) => {
	 *       console.log('Connected to Client!', ctr["@"].text)
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
	 * Add an Event when someone wants to Connect to the Socket
	 * @example
	 * ```
	 * const controller = new Server({ })
	 * 
	 * controller.path('/', (path) => path
	 *   .ws('/ws', (ws) => ws
	 *     .onUpgrade((ctr, end) => {
	 *       if (!ctr.queries.has('confirm')) return end(ctr.status(Status.BAD_REQUEST).print('Forgor the Confirm query'))
	 *     })
	 *   )
	 * )
	 * ```
	 * @since 5.10.0
	*/ public onUpgrade(
		/** The Async Code to run when the Socket gets an Upgrade HTTP Request */ code: WebSocket<Context, never, Middlewares>['onUpgrade']
	): this {
		this.data.onUpgrade = code as any

		return this
	}

	/**
	 * Add an Event when someone Establishes a connection to the Socket
	 * @example
	 * ```
	 * const controller = new Server({ })
	 * 
	 * controller.path('/', (path) => path
	 *   .ws('/ws', (ws) => ws
	 *     .onConnect((ctr) => {
	 *       console.log('Connected to Client')
	 *     })
	 *   )
	 * )
	 * ```
	 * @since 5.4.0
	*/ public onConnect(
		/** The Async Code to run when the Socket is Established */ code: WebSocket<Context, never, Middlewares>['onConnect']
	): this {
		this.data.onConnect = code as any

		return this
	}

	/**
	 * Add an Event when someone sends a Message to the Socket
	 * @example
	 * ```
	 * const controller = new Server({ })
	 * 
	 * controller.path('/', (path) => path
	 *   .ws('/ws', (ws) => ws
	 *     .onMessage((ctr) => {
	 *       ctr.print(ctr.message)
	 *     })
	 *   )
	 * )
	 * ```
	 * @since 5.4.0
	*/ public onMessage(
		/** The Async Code to run on a Message */ code: WebSocket<Context, Message, Middlewares>['onMessage']
	): this {
		this.data.onMessage = code as any

		return this
	}

	/**
	 * Add an Event when someone Disconnects from the Socket
	 * @example
	 * ```
	 * const controller = new Server({ })
	 * 
	 * controller.path('/', (path) => path
	 *   .ws('/ws', (ws) => ws
	 *     .onClose((ctr) => {
	 *       console.log('Closed Client Connection')
	 *     })
	 *   )
	 * )
	 * ```
	 * @since 5.4.0
	*/ public onClose(
		/** The Async Code to run when the Socket Closes */ code: WebSocket<Context, Message, Middlewares>['onClose']
	): this {
		this.data.onClose = code as any

		return this
	}


	/**
	 * Internal Method for Generating WebSocket Object
	 * @since 6.0.0
	*/ public getData(prefix: string) {
		if (isRegExp(this.data.path) && 'pathStartWith' in this.data) this.data.pathStartWith = prefix

		return {
			webSockets: [this.data]
		}
	}
}