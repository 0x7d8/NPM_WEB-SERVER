import Route from "@/classes/Route"
import RateLimit from "@/classes/router/RateLimit"
import { as, object } from "@rjweb/utils"
import { UsableMiddleware } from "@/classes/Middleware"
import { UsableValidator } from "@/classes/Validator"
import { DataContext, EndFn, RateLimitConfig, RealAny, UnionToIntersection } from "@/types/internal"
import HttpRequestContext from "@/classes/request/HttpRequestContext"
import WsOpenContext from "@/classes/request/WsOpenContext"
import WsMessageContext from "@/classes/request/WsMessageContext"
import WsCloseContext from "@/classes/request/WsCloseContext"
import { OperationObject } from "openapi3-ts/oas31"

export default class Ws<Middlewares extends UsableMiddleware[] = [], Validators extends UsableValidator[] = [], Context extends Record<string, any> = {}, Excluded extends (keyof Ws)[] = []> {
	protected route: Route<'ws'>

	/**
	 * Create a new HTTP Route Builder
	 * @since 7.0.0
	*/ constructor(path: string | RegExp, ratelimit?: RateLimitConfig) {
		this.route = new Route('ws', 'GET', path, {})
		if (ratelimit) this.route.ratelimit = ratelimit
	}

	/**
	 * Add OpenAPI Documentation to all HTTP Endpoints in this Path (and all children)
	 * @since 9.0.0
	*/ public document(item: OperationObject): Omit<Ws<Middlewares, Validators, Context, [...Excluded, 'document']>, Excluded[number] | 'document'> {
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
	 *   .ws('/hello', (ws) => ws
	 *     .ratelimit((limit) => limit
	 *       .hits(5)
	 *       .timeWindow(time(20).s())
	 *       .penalty(0)
	 *     ) // This will allow 5 messages every 20 seconds
	 *     .onOpen((ctr) => {
	 *       ctr.print('Hello bro!')
	 *     })
	 *     .onMessage((ctr) => {
	 *       ctr.print('Nice bro!')
	 *     })
	 *     .onClose((ctr) => {
	 *       console.log('Bye bro!')
	 *     })
	 *   )
	 * )
	 * 
	 * server.rateLimit('wsMessage', (ctr) => {
	 *   ctr.print(`Please wait ${ctr.getRateLimit()?.resetIn}ms!!!!!`)
	 * })
	 * ```
	 * @since 8.6.0
	*/ public ratelimit(callback: (limit: RateLimit) => any): Omit<Ws<Middlewares, Validators, Context, [...Excluded, 'ratelimit']>, Excluded[number] | 'ratelimit'> {
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
	*/ public context<_Context extends Record<string, any>>(): Omit<Ws<Middlewares, Validators, Context & _Context, [...Excluded, 'context']>, Excluded[number] | 'context'> {
		return as<any>(this)
	}

	/**
	 * Use a Validator on this Endpoint
	 * 
	 * This will attach a Validator to this Endpoint, which will be run before the
	 * Endpoint is executed. If the Validator fails, the Endpoint will not be executed.
	 * @since 9.0.0
	*/ public validate<_Validator extends UsableValidator<any>>(validator: _Validator): Ws<Middlewares, [...Validators, _Validator], Context, Excluded> {
		this.route.validators.push(validator)
		this.route.openApi = object.deepMerge(this.route.openApi, validator.openApi)

		return as<any>(this)
	}

	/**
	 * Attach a Callback for when someone makes an HTTP request to upgrade to a WebSocket
	 * 
	 * This will attach a callback for when the server recieves a http request and
	 * finishes parsing it for the user. This Handler is not required to be set, but
	 * if you want to do additional checks before upgrading to a WebSocket, you can
	 * attach this handler.
	 * @example
	 * ```
	 * const server = new Server(...)
	 * 
	 * server.path('/', (path) => path
	 *   .ws('/hello', (http) => http
	 *     .onUpgrade((ctr, end) => {
	 *       if (!ctr.queries.has('gay')) return end(ctr.status(ctr.$status.BAD_REQUEST).print('No Gay query'))
	 *     })
	 *   )
	 * )
	 * ```
	 * @since 5.10.0
	*/ public onUpgrade(
		callback: (ctr: DataContext<'HttpRequest', 'GET', HttpRequestContext<Context & UnionToIntersection<Validators[number]['context']>>, Middlewares>, end: EndFn) => RealAny
	): Omit<Ws<Middlewares, Validators, Context, [...Excluded, 'onUpgrade']>, Excluded[number] | 'onUpgrade'> {
		this.route.data.onUpgrade = callback as any

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
	 * const server = new Server(...)
	 * 
	 * server.path('/', (path) => path
	 *   .ws('/ws', (ws) => ws
	 *     .onOpen((ctr) => {
	 *       console.log('Connected to Client')
	 *     })
	 *   )
	 * )
	 * ```
	 * @since 5.4.0
	*/ public onOpen(
		callback: (ctr: DataContext<'WsOpen', 'GET', WsOpenContext<Context & UnionToIntersection<Validators[number]['context']>>, Middlewares>) => RealAny
	): Omit<Ws<Middlewares, Validators, Context, [...Excluded, 'onOpen']>, Excluded[number] | 'onOpen'> {
		this.route.data.onOpen = callback as any

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
	 * const server = new Server(...)
	 * 
	 * server.path('/', (path) => path
	 *   .ws('/ws', (ws) => ws
	 *     .onMessage((ctr) => {
	 *       ctr.print(ctr.message)
	 *     })
	 *   )
	 * )
	 * ```
	 * @since 5.4.0
	*/ public onMessage(
		callback: (ctr: DataContext<'WsMessage', 'GET', WsMessageContext<Context & UnionToIntersection<Validators[number]['context']>>, Middlewares>) => RealAny
	): Omit<Ws<Middlewares, Validators, Context, [...Excluded, 'onMessage']>, Excluded[number] | 'onMessage'> {
		this.route.data.onMessage = callback as any

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
	*/ public onClose(
		callback: (ctr: DataContext<'WsClose', 'GET', WsCloseContext<Context & UnionToIntersection<Validators[number]['context']>>, Middlewares>) => RealAny
	): Omit<Ws<Middlewares, Validators, Context, [...Excluded, 'onClose']>, Excluded[number] | 'onClose'> {
		this.route.data.onClose = callback as any

		return as<any>(this)
	}
}