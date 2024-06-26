import { DataContext, EndFn, RealAny, SetItemType } from "@/types/internal"
import { UsableMiddleware } from "@/classes/Middleware"
import HttpRequestContext from "@/classes/request/HttpRequestContext"
import WsOpenContext from "@/classes/request/WsOpenContext"
import WsMessageContext from "@/classes/request/WsMessageContext"
import WsCloseContext from "@/classes/request/WsCloseContext"
import Base from "@/classes/request/Base"
import { object } from "@rjweb/utils"
import { oas31 } from "openapi3-ts"
import deepClone from "@/functions/deepClone"


type Listeners<Data extends Record<string, any>, Context extends Record<string, any>, Middlewares extends UsableMiddleware[] = []> = {
	httpRequest: Set<((ctr: DataContext<'HttpRequest', 'POST', HttpRequestContext<Context>, Middlewares>, end: EndFn, data: Data) => RealAny)>
	httpRequestFinish: Set<((ctr: DataContext<'HttpRequest', 'POST', Base<Context>, Middlewares>, ms: number) => RealAny)>

	wsOpen: Set<((ctr: DataContext<'WsOpen', 'GET', WsOpenContext<'open', Context>, Middlewares>, end: EndFn, data: Data) => RealAny)>
	wsOpenFinish: Set<((ctr: DataContext<'WsOpen', 'GET', Base<Context>, Middlewares>, ms: number) => RealAny)>
	wsMessage: Set<((ctr: DataContext<'WsMessage', 'GET', WsMessageContext<Context>, Middlewares>, end: EndFn, data: Data) => RealAny)>
	wsMessageFinish: Set<((ctr: DataContext<'WsMessage', 'GET', Base<Context>, Middlewares>, ms: number) => RealAny)>
	wsClose: Set<((ctr: DataContext<'WsClose', 'GET', WsCloseContext<Context>, Middlewares>, end: EndFn, data: Data) => RealAny)>
	wsCloseFinish: Set<((ctr: DataContext<'WsClose', 'GET', Base<Context>, Middlewares>, ms: number) => RealAny)>
}

export default class Validator<Data extends Record<string, any> = {}, Context extends Record<string, any> = {}, Middlewares extends UsableMiddleware[] = []> {
	private openApi: oas31.OperationObject = {}
	private openApiFn: ((data: Data) => oas31.OperationObject) | null = null
	private listeners: Listeners<Data, Context, Middlewares> = {
		httpRequest: new Set(),
		httpRequestFinish: new Set(),
		wsOpen: new Set(),
		wsOpenFinish: new Set(),
		wsMessage: new Set(),
		wsMessageFinish: new Set(),
		wsClose: new Set(),
		wsCloseFinish: new Set()
	}

	/**
	 * Create a new Validator
	 * @example
	 * ```
	 * import { Server, Channel } from "rjweb-server"
	 * import { Runtime } from "@rjweb/runtime-generic"
	 * import { network, number } from "@rjweb/utils"
	 * 
	 * const echo = new Channel<string>()
	 * 
	 * const server = new Server(Runtime, {
	 *   port: 8000
	 * })
	 * 
	 * const authorize = new server.Validator<{ password: string }>()
	 *   .http((ctr, end, data) => {
	 *     if (!ctr.headers.has('authorization')) return end(ctr.status(ctr.$status.BAD_REQUEST).print('Authorization Required'))
	 *     if (ctr.headers.get('authorization') !== data.password) return end(ctr.status(ctr.$status.UNAUTHORIZED).print('Authorization Required'))
	 *   })
	 * 
	 * const authorizeLast = new server.Validator<{ allowedIP: network.IPAddress }>()
	 *   .extend(authorize)
	 *   .context<{
	 *     random: number
	 *   }>()
	 *   .http((ctr, end, data) => {
	 *     if (!ctr.client.ip.equals(data.allowedIP)) return end(ctr.status(ctr.$status.UNAUTHORIZED).print('Invalid IP'))
	 * 
	 *     ctr["@"].random = number.generate(0, 100)
	 *   })
	 * 
	 * server.path('/', (path) => path
	 *   .ws('/echo', (ws) => ws
	 *     .validate(authorize.use({ password: '123' }))
	 *     .onConnect((ctr) => {
	 *       ctr.subscribe(echo)
	 *     })
	 *     .onMessage((ctr) => {
	 *       echo.send(ctr.rawMessage()) // will send the message to all subscribed sockets
	 *     })
	 *   )
	 *   .http('GET', '/last-echo', (http) => http
	 *     .validate(authorizeLast.use({ password: '123', allowedIP: new network.IPAddress('127.1') }))
	 *     .onRequest((ctr) => {
	 *       return ctr.print(
	 *         echo.last() +
	 *         `\n${ctr["@"].random}`
	 *       )
	 *     })
	 *   )
	 * )
	 * 
	 * server.start().then(() => console.log('Server Started!'))
	 * ```
	 * @since 9.0.0
	*/ constructor() { }

	/**
	 * Add OpenAPI Documentation to all Endpoints using this Validator
	 * @since 9.0.0
	*/ public document(item: oas31.OperationObject | ((data: Data) => oas31.OperationObject)): this {
		if (typeof item !== 'function') this.openApi = object.deepMerge(this.openApi, item)
		else this.openApiFn = item

		return this
	}

	/**
	 * Add context variables to the validator, typescript only
	 * @since 9.0.0
	*/ public context<NewContext extends Record<string, any>>(): Validator<Data, Context & NewContext, Middlewares> {
		return this as any
	}

	/**
	 * Extend on another validator
	 * @since 9.0.0
	*/ public extend<V extends Validator<any, any, any>, _Data extends [any, any] = V extends Validator<infer Data, infer Context> ? [Data, Context] : [{}, {}]>(validator: V): Validator<Data & _Data[0], Context & _Data[1], Middlewares> {
		this.listeners.httpRequest = new Set([ ...validator.listeners.httpRequest.values(), ...this.listeners.httpRequest.values() ])
		this.listeners.httpRequestFinish = new Set([ ...validator.listeners.httpRequestFinish.values(), ...this.listeners.httpRequestFinish.values() ])
		this.listeners.wsOpen = new Set([ ...validator.listeners.wsOpen.values(), ...this.listeners.wsOpen.values() ])
		this.listeners.wsOpenFinish = new Set([ ...validator.listeners.wsOpenFinish.values(), ...this.listeners.wsOpenFinish.values() ])
		this.listeners.wsMessage = new Set([ ...validator.listeners.wsMessage.values(), ...this.listeners.wsMessage.values() ])
		this.listeners.wsMessageFinish = new Set([ ...validator.listeners.wsMessageFinish.values(), ...this.listeners.wsMessageFinish.values() ])
		this.listeners.wsClose = new Set([ ...validator.listeners.wsClose.values(), ...this.listeners.wsClose.values() ])
		this.listeners.wsCloseFinish = new Set([ ...validator.listeners.wsCloseFinish.values(), ...this.listeners.wsCloseFinish.values() ])
		this.openApi = deepClone(object.deepMerge(this.openApi, validator.openApi))

		const openApiFn = this.openApiFn
		if (validator.openApiFn) this.openApiFn = (data) => object.deepMerge(openApiFn?.(data) ?? {}, validator.openApiFn?.(data) ?? {})

		return this as any
	}


	/**
	 * Add a validation step for an http event
	 * @since 9.0.0
	*/ public httpRequest(handler: SetItemType<Listeners<Data, Context, Middlewares>['httpRequest']>): this {
		this.listeners.httpRequest.add(handler)

		return this
	}

	/**
	 * Listen for an http finish event
	 * @since 9.6.0
	*/ public httpRequestFinish(handler: SetItemType<Listeners<Data, Context, Middlewares>['httpRequestFinish']>): this {
		this.listeners.httpRequestFinish.add(handler)

		return this
	}

	/**
	 * Add a validation step for a websocket open event
	 * @since 9.0.0
	*/ public wsOpen(handler: SetItemType<Listeners<Data, Context, Middlewares>['wsOpen']>): this {
		this.listeners.wsOpen.add(handler)

		return this
	}

	/**
	 * Listen for a websocket open finish event
	 * @since 9.6.0
	*/ public wsOpenFinish(handler: SetItemType<Listeners<Data, Context, Middlewares>['wsOpenFinish']>): this {
		this.listeners.wsOpenFinish.add(handler)

		return this
	}

	/**
	 * Add a validation step for a websocket message event
	 * @since 9.0.0
	*/ public wsMessage(handler: SetItemType<Listeners<Data, Context, Middlewares>['wsMessage']>): this {
		this.listeners.wsMessage.add(handler)

		return this
	}

	/**
	 * Listen for a websocket message finish event
	 * @since 9.6.0
	*/ public wsMessageFinish(handler: SetItemType<Listeners<Data, Context, Middlewares>['wsMessageFinish']>): this {
		this.listeners.wsMessageFinish.add(handler)

		return this
	}

	/**
	 * Add a validation step for a websocket close event
	 * @since 9.0.0
	*/ public wsClose(handler: SetItemType<Listeners<Data, Context, Middlewares>['wsClose']>): this {
		this.listeners.wsClose.add(handler)

		return this
	}

	/**
	 * Listen for a websocket close finish event
	 * @since 9.6.0
	*/ public wsCloseFinish(handler: SetItemType<Listeners<Data, Context, Middlewares>['wsCloseFinish']>): this {
		this.listeners.wsCloseFinish.add(handler)

		return this
	}


	/**
	 * Use the Validator
	 * @since 9.0.0
	*/ public use(data: Data): UsableValidator<Context> {
		return {
			data,
			listeners: this.listeners,
			openApi: object.deepMerge(this.openApi, this.openApiFn?.(data) ?? {}),
		} satisfies Omit<UsableValidator, 'NOTICE' | 'context'> as never
	}
}

export type UsableValidator<Context extends Record<string, any> = {}> = {
	NOTICE: 'DO NOT CALL MANUALLY, THIS IS FOR RJWEB INTERNALLY'
	data: Record<string, any>
	listeners: Listeners<any, any, any>
	context: Context
	openApi: oas31.OperationObject
}