import { WsConnect, WsMessage, WsClose, HttpRequest } from "../types/external"
import { LocalContext, GlobalContext } from "../types/context"
import { RealAny, EndFn } from "../types/internal"

export const currentVersion = 2

export interface MiddlewareData<
	Config extends Record<any, any>,
	Context extends Record<any, any>,
	HTTPContext extends new(...args: any[]) => any,
	WSConnectContext extends new(...args: any[]) => any,
	WSMessageContext extends new(...args: any[]) => any,
	WSCloseContext extends new(...args: any[]) => any
> {
	/** The Code to run when the Middleware gets loaded */ initEvent?(localContext: Context, config: Config, ctg: GlobalContext): RealAny
	/** The Code to run when an HTTP Request Triggers */ httpEvent?(localContext: Context, end: EndFn, ctr: HttpRequest, ctx: LocalContext, ctg: GlobalContext): RealAny
	/** The Code to run when a WebSocket Connects */ wsConnectEvent?(localContext: Context, end: EndFn, ctr: WsConnect, ctx: LocalContext, ctg: GlobalContext): RealAny
	/** The Code to run when a WebSocket Recieves a Message */ wsMessageEvent?(localContext: Context, end: EndFn, ctr: WsMessage, ctx: LocalContext, ctg: GlobalContext): RealAny
	/** The Code to run when a WebSocket Closes */ wsCloseEvent?(localContext: Context, end: EndFn, ctr: WsClose, ctx: LocalContext, ctg: GlobalContext): RealAny

	/** Class Modifications */ classModifications: {
		http: HTTPContext,
		wsConnect: WSConnectContext,
		wsMessage: WSMessageContext,
		wsClose: WSCloseContext
	}
}

class Dummy {}

export class MiddlewareLoader<
	Config extends Record<any, any>,
	Context extends Record<any, any>,
	HTTPContext extends new(...args: any[]) => any,
	WSConnectContext extends new(...args: any[]) => any,
	WSMessageContext extends new(...args: any[]) => any,
	WSCloseContext extends new(...args: any[]) => any
> {
	protected context: Context
	protected data: MiddlewareData<Config, Context, HTTPContext, WSConnectContext, WSMessageContext, WSCloseContext>

	constructor(data: MiddlewareData<Config, Context, HTTPContext, WSConnectContext, WSMessageContext, WSCloseContext>, context: Context) {
		this.data = data
		this.context = context
	}

	/**
	 * Configure the Middleware
	 * @since 7.0.0
	 * @from rjweb-server
	*/ public config(config: Config): {
		/** The Internal Data of the Middleware */ data: MiddlewareData<Config, Context, HTTPContext, WSConnectContext, WSMessageContext, WSCloseContext>
		/** The Provided Config to the Middleware */ config: Config
		/** The Version of the Middleware Builder */ version: number
		/** The Internal Context of the Middleware */ localContext: Context
	} {
		return {
			data: this.data,
			config,
			version: currentVersion,
			localContext: this.context
		} as any
	}
}

export default class MiddlewareBuilder<
	Config extends Record<any, any> = {},
	Context extends Record<any, any> = {},
	HTTPContext extends new(...args: any[]) => any = typeof Dummy,
	WSConnectContext extends new(...args: any[]) => any = typeof Dummy,
	WSMessageContext extends new(...args: any[]) => any = typeof Dummy,
	WSCloseContext extends new(...args: any[]) => any = typeof Dummy
> {
	private data: MiddlewareData<Config, Context, HTTPContext, WSConnectContext, WSMessageContext, WSCloseContext> = {
		classModifications: {
			httpRequest: class extends HttpRequest {},
			wsConnect: class extends WsConnect {},
			wsMessage: class extends WsMessage {},
			wsClose: class extends WsClose {}
		} as any
	}

	private dataContext: Context = {} as any
	protected version = currentVersion

	/**
	 * Set the default Context State
	 * @since 7.0.0
	*/ public context(
		/** The Initial Context */ context: Context
	): this {
		this.dataContext = context

		return this
	}

	/**
	 * Set the extended Class for the HTTP Context
	 * @example
	 * ```
	 * const middleware = new MiddlewareBuilder()
	 *   .httpClass((Expand) => class extends Expand {
	 *     printHi() {
	 *       this.print('Hi')
	 *     }
	 *   })
	 *   .build()
	 * ```
	 * @since 7.0.0
	*/ public httpClass<Class extends new(...args: any[]) => any>(
		/** The Callback to the Class extending the HTTP Class */ callback: (extend: typeof HttpRequest) => Class
	): MiddlewareBuilder<Config, Context, Class, WSConnectContext, WSMessageContext, WSCloseContext> {
		this.data.classModifications.http = callback(HttpRequest) as any

		const builder = new MiddlewareBuilder()
		builder.data = this.data
		builder.dataContext = this.dataContext
		builder.version = this.version

		return builder as any
	}

	/**
	 * Set the extended Class for the WebSocket Connect Context
	 * @example
	 * ```
	 * const middleware = new MiddlewareBuilder()
	 *   .wsConnectClass((Expand) => class extends Expand {
	 *     printHi() {
	 *       this.print('Hi')
	 *     }
	 *   })
	 *   .build()
	 * ```
	 * @since 7.0.0
	*/ public wsConnectClass<Class extends new(...args: any[]) => any>(
		/** The Callback to the Class extending the HTTP Class */ callback: (extend: typeof WsConnect) => Class
	): MiddlewareBuilder<Config, Context, HTTPContext, Class, WSMessageContext, WSCloseContext> {
		this.data.classModifications.wsConnect = callback(WsConnect) as any

		const builder = new MiddlewareBuilder()
		builder.data = this.data
		builder.dataContext = this.dataContext
		builder.version = this.version

		return builder as any
	}

	/**
	 * Set the extended Class for the WebSocket Message Context
	 * @example
	 * ```
	 * const middleware = new MiddlewareBuilder()
	 *   .wsMessageClass((Expand) => class extends Expand {
	 *     printHi() {
	 *       this.print('Hi')
	 *     }
	 *   })
	 *   .build()
	 * ```
	 * @since 7.0.0
	*/ public wsMessageClass<Class extends new(...args: any[]) => any>(
		/** The Callback to the Class extending the HTTP Class */ callback: (extend: typeof WsMessage) => Class
	): MiddlewareBuilder<Config, Context, HTTPContext, WSConnectContext, Class, WSCloseContext> {
		this.data.classModifications.wsMessage = callback(WsMessage) as any
	
		const builder = new MiddlewareBuilder()
		builder.data = this.data
		builder.dataContext = this.dataContext
		builder.version = this.version
	
		return builder as any
	}

	/**
	 * Set the extended Class for the WebSocket Close Context
	 * @example
	 * ```
	 * const middleware = new MiddlewareBuilder()
	 *   .wsCloseClass((Expand) => class extends Expand {
	 *     logBye() {
	 *       console.log('Bye,', this.client.ip)
	 *     }
	 *   })
	 *   .build()
	 * ```
	 * @since 7.0.0
	*/ public wsCloseClass<Class extends new(...args: any[]) => any>(
		/** The Callback to the Class extending the HTTP Class */ callback: (extend: typeof WsClose) => Class
	): MiddlewareBuilder<Config, Context, HTTPContext, WSConnectContext, WSMessageContext, Class> {
		this.data.classModifications.wsClose = callback(WsClose) as any
	
		const builder = new MiddlewareBuilder()
		builder.data = this.data
		builder.dataContext = this.dataContext
		builder.version = this.version
	
		return builder as any
	}

	/**
	 * Add a Callback for when the Middleware gets loaded
	 * @since 5.7.0
	*/ public init(
		/** The Function to Call on a HTTP Request */ callback: MiddlewareData<Config, Context, HTTPContext, WSConnectContext, WSMessageContext, WSCloseContext>['initEvent']
	): this {
		this.data.initEvent = callback

		return this
	}

	/**
	 * Add a Callback for HTTP Requests
	 * @since 5.7.0
	*/ public http(
		/** The Function to Call on a HTTP Request */ callback: MiddlewareData<Config, Context, HTTPContext, WSConnectContext, WSMessageContext, WSCloseContext>['httpEvent']
	): this {
		this.data.httpEvent = callback

		return this
	}

	/**
	 * Add a Callback for WebSocket Connections
	 * @since 5.7.0
	*/ public wsConnect(
		/** The Function to Call on a WebSocket Connection */ callback: MiddlewareData<Config, Context, HTTPContext, WSConnectContext, WSMessageContext, WSCloseContext>['wsConnectEvent']
	): this {
		this.data.wsConnectEvent = callback

		return this
	}

	/**
	 * Add a Callback for WebSocket Messages
	 * @since 5.7.0
	*/ public wsMessage(
		/** The Function to Call on a WebSocket Message */ callback: MiddlewareData<Config, Context, HTTPContext, WSConnectContext, WSMessageContext, WSCloseContext>['wsMessageEvent']
	): this {
		this.data.wsMessageEvent = callback

		return this
	}

	/**
	 * Add a Callback for Closing WebSockets
	 * @since 5.7.0
	*/ public wsClose(
		/** The Function to Call on a Closed WebSocket */ callback: MiddlewareData<Config, Context, HTTPContext, WSConnectContext, WSMessageContext, WSCloseContext>['wsCloseEvent']
	): this {
		this.data.wsCloseEvent = callback

		return this
	}


	/**
	 * Get the Production Version of this Class (required to load)
	 * @since 5.7.0
	*/ public build(): MiddlewareLoader<Config, Context, HTTPContext, WSConnectContext, WSMessageContext, WSCloseContext> {
		return new MiddlewareLoader(this.data, this.dataContext)
	}
}