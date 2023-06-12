import { isRegExp } from "util/types"
import { MiddlewareInitted, RoutedValidation } from "../../types/internal"
import WebSocket from "../../types/webSocket"

export default class RouteWS<GlobContext extends Record<any, any> = {}, Context extends Record<any, any> = {}, Message = unknown, Middlewares extends MiddlewareInitted[] = [], Path extends string = '/'> {
	private data: WebSocket

	/** Generate WS Endpoint */
	constructor(
		/** The Path of the Routes */ path: Path | RegExp,
		/** The Validations to add */ validations: RoutedValidation[] = [],
		/** The Headers to add */ headers: Record<string, Buffer> = {}
	) {
		if (isRegExp(path)) {
			this.data = {
				type: 'websocket',

				path,
				pathStartWith: '/',
				data: {
					validations,
					headers
				}, context: { data: {}, keep: true }
			}
		} else {
			this.data = {
				type: 'websocket',
	
				path,
				pathArray: path.split('/'),
				data: {
					validations,
					headers
				}, context: { data: {}, keep: true }
			}	
		}
	}

	/**
	 * Add a default State for the Request Context (which stays for the entire requests / websockets lifecycle)
	 * 
	 * This will set the default context for the request. This applies to all callbacks
	 * attached to this handler. When `keepForever` is enabled, the context will be shared
	 * between requests to this callback and therefore will be globally mutable. This may be
	 * useful for something like a message or request counter so you dont have to worry about
	 * transferring it around.
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

		this.data.context = {
			data: context,
			keep: keepForever
		}

		return this
	}

	/**
	 * Attach a Callback for when someone wants to Upgrade from HTTP a Socket
	 * 
	 * This will attach a callback for when the client sends an http request but
	 * wants to upgrade to a websocket connection. This callback will probably only
	 * ever be used to initialize the context or validate the request before transferring
	 * to a connection. when wanting to stop the server from upgrading, call the 2nd
	 * function argument to force ending the connection process and switching to a normal
	 * http request.
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
		/** The Async Code to run when the Socket gets an Upgrade HTTP Request */ code: WebSocket<GlobContext & Context, never, Middlewares, Path>['onUpgrade']
	): this {
		this.data.onUpgrade = code as any

		return this
	}

	/**
	 * Attach a Callback for when someone Establishes a connection to the Socket
	 * 
	 * This will attach a callback for when the websocket connection is established
	 * and ready for use. This callback will commonly be used to attach references using
	 * `.printRef()` or similar.
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
		/** The Async Code to run when the Socket is Established */ code: WebSocket<GlobContext & Context, never, Middlewares, Path>['onConnect']
	): this {
		this.data.onConnect = code as any

		return this
	}

	/**
	 * Attach a Callback for when someone sends a Message to the Socket
	 * 
	 * This will attach a callback for when the server recieves a message from
	 * the Client. This event can be disabled completely by setting `message.enabled`
	 * to false in the initial Server Options.
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
		/** The Async Code to run on a Message */ code: WebSocket<GlobContext & Context, Message, Middlewares, Path>['onMessage']
	): this {
		this.data.onMessage = code as any

		return this
	}

	/**
	 * Attach a Callback for when the Socket closes
	 * 
	 * This will attach a callback for when the Socket is closed in any way
	 * that should trigger this (basically all). In this callback `.message`
	 * will be the message the client sent as reason for the close or just empty
	 * when the client didnt send a reason or the server closed the socket.
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
		/** The Async Code to run when the Socket Closes */ code: WebSocket<GlobContext & Context, Message, Middlewares, Path>['onClose']
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