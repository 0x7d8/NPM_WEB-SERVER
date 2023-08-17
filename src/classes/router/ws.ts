import { MiddlewareInitted, RoutedValidation, ExcludeFrom } from "../../types/internal"
import RPath from "../path"
import WebSocket from "../../types/webSocket"
import { as, zValidate } from "rjutils-collection"
import RouteRateLimit from "./rateLimit"

export default class RouteWS<GlobContext extends Record<any, any> = {}, Context extends Record<any, any> = {}, Message = unknown, Middlewares extends MiddlewareInitted[] = [], Path extends string = '/', Excluded extends (keyof RouteWS)[] = []> {
	private data: WebSocket

	/** Generate WS Endpoint */
	constructor(
		/** The Path of the Routes */ path: Path | RegExp,
		/** The Validations to add */ validations: RoutedValidation[] = [],
		/** The Headers to add */ headers: Record<string, Buffer> = {},
		/** The Ratelimit to apply */ ratelimit: RouteRateLimit['data']
	) {
		this.data = {
			type: 'websocket',

			path: new RPath('GET', path),
			data: {
				ratelimit,
				validations,
				headers
			}, context: { data: {}, keep: true }
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
	*/ @zValidate([ (z) => z.record(z.any(), z.any()), (z) => z.object({ keepForever: z.boolean().optional() }).optional() ])
	public context<Context extends Record<any, any>>(
		/** The Default State of the Request Context */ context: Context,
		/** The Options for this Function */ options: {
			/**
			 * Whether to keep the Data for the entirety of the Processes Lifetime
			 * @default false
			 * @since 7.0.0
			*/ keepForever?: boolean
		} = {}
	): ExcludeFrom<RouteWS<GlobContext, Context, Message, Middlewares, Path, [...Excluded, 'context']>, [...Excluded, 'context']> {
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
	 * When a User sends a message to this Socket, that will count against their hit count, if
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
	 *   .ws('/echo', (ws) => ws
	 *     .onMessage(async(ctr) => {
	 *       ctr.print(ctr.rawBodyBytes)
	 *     })
	 *   )
	 * )
	 * 
	 * controller.on('httpRatelimit', (ctr) => {
	 *   ctr.print(`Please wait ${ctr.getRateLimit()?.resetIn}ms!!!!!`)
	 * })
	 * ```
	 * @since 8.6.0
	*/ @zValidate([ (z) => z.function() ])
	public ratelimit(
		callback: (limit: RouteRateLimit) => any
	): ExcludeFrom<RouteWS<GlobContext, Context, Message, Middlewares, Path, [...Excluded, 'ratelimit']>, [...Excluded, 'ratelimit']> {
		const limit = new RouteRateLimit()
		limit['data'] = Object.assign({}, this.data.data.ratelimit)

		callback(limit)

		this.data.data.ratelimit = limit['data']

		return as<any>(this)
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
	*/ @zValidate([ (z) => z.function() ])
	public onUpgrade(
		/** The Async Callback to run when the Socket gets an Upgrade HTTP Request */ callback: WebSocket<GlobContext & Context, never, Middlewares, Path>['onUpgrade']
	): ExcludeFrom<RouteWS<GlobContext, Context, Message, Middlewares, Path, [...Excluded, 'onUpgrade']>, [...Excluded, 'onUpgrade']> {
		this.data.onUpgrade = callback as any

		return as<any>(this)
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
	*/ @zValidate([ (z) => z.function() ])
	public onConnect(
		/** The Async Callback to run when the Socket is Established */ callback: WebSocket<GlobContext & Context, never, Middlewares, Path>['onConnect']
	): ExcludeFrom<RouteWS<GlobContext, Context, Message, Middlewares, Path, [...Excluded, 'onConnect']>, [...Excluded, 'onConnect']> {
		this.data.onConnect = callback as any

		return as<any>(this)
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
	*/ @zValidate([ (z) => z.function() ])
	public onMessage(
		/** The Async Callback to run on a Message */ callback: WebSocket<GlobContext & Context, Message, Middlewares, Path>['onMessage']
	): ExcludeFrom<RouteWS<GlobContext, Context, Message, Middlewares, Path, [...Excluded, 'onMessage']>, [...Excluded, 'onMessage']> {
		this.data.onMessage = callback as any

		return as<any>(this)
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
	*/ @zValidate([ (z) => z.function() ])
	public onClose(
		/** The Async Callback to run when the Socket Closes */ callback: WebSocket<GlobContext & Context, Message, Middlewares, Path>['onClose']
	): ExcludeFrom<RouteWS<GlobContext, Context, Message, Middlewares, Path, [...Excluded, 'onClose']>, [...Excluded, 'onClose']> {
		this.data.onClose = callback as any

		return as<any>(this)
	}


	/**
	 * Internal Method for Generating WebSocket Object
	 * @since 6.0.0
	*/ public getData(prefix: string) {
		this.data.path.addPrefix(prefix)

		return {
			webSockets: [this.data]
		}
	}
}