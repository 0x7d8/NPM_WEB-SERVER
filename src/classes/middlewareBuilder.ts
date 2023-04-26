import { WebSocketClose, WebSocketConnect, WebSocketMessage } from "../types/webSocket"
import { InternalContext, GlobalContext } from "../types/context"
import { RealAny, EndFn } from "../types/internal"
import { HTTPRequestContext } from "../types/external"

export const currentVersion = 1

export interface MiddlewareProduction<Config extends object = {}, Context extends object = {}> {
	/**
	 * Inititalize the Middleware
	*/ init(config?: Config): {
		/** The Internal Data of the Middleware */ data: MiddlewareData<Config, Context>
		/** The Provided Config to the Middleware */ config: Config | undefined
		/** The Version of the Middleware Builder */ version: number
		/** The Internal Context of the Middleware */ localContext: Context
	}
}

export interface MiddlewareData<Config extends object = {}, Context extends object = {}> {
	/** The Code to run when the Middleware gets loaded */ initEvent?(localContext: Context, config: Config | undefined, ctg: GlobalContext): RealAny
	/** The Code to run when an HTTP Request Triggers */ httpEvent?(localContext: Context, end: EndFn, ctr: HTTPRequestContext, ctx: InternalContext, ctg: GlobalContext): RealAny
	/** The Code to run when a WebSocket Connects */ wsConnectEvent?(localContext: Context, end: EndFn, ctr: WebSocketConnect, ctx: InternalContext, ctg: GlobalContext): RealAny
	/** The Code to run when a WebSocket Recieves a Message */ wsMessageEvent?(localContext: Context, end: EndFn, ctr: WebSocketMessage, ctx: InternalContext, ctg: GlobalContext): RealAny
	/** The Code to run when a WebSocket Closes */ wsCloseEvent?(localContext: Context, end: EndFn, ctr: WebSocketClose, ctx: InternalContext, ctg: GlobalContext): RealAny
}

export default class MiddlewareBuilder<Config extends object = {}, Context extends object = {}>{
	private data: MiddlewareData<Config, Context> = {}
	private context: Context = {} as any
	protected version = currentVersion

	/**
	 * Add a Callback for when the Middleware gets loaded
	 * @since 5.7.0
	*/ init(
		/** The Function to Call on a HTTP Request */ callback: MiddlewareData<Config, Context>['initEvent']
	) {
		this.data.initEvent = callback

		return this
	}

	/**
	 * Add a Callback for HTTP Requests
	 * @since 5.7.0
	*/ http(
		/** The Function to Call on a HTTP Request */ callback: MiddlewareData<Config, Context>['httpEvent']
	) {
		this.data.httpEvent = callback

		return this
	}

	/**
	 * Add a Callback for WebSocket Connections
	 * @since 5.7.0
	*/ wsConnect(
		/** The Function to Call on a WebSocket Connection */ callback: MiddlewareData<Config, Context>['wsConnectEvent']
	) {
		this.data.wsConnectEvent = callback

		return this
	}

	/**
	 * Add a Callback for WebSocket Messages
	 * @since 5.7.0
	*/ wsMessage(
		/** The Function to Call on a WebSocket Message */ callback: MiddlewareData<Config, Context>['wsMessageEvent']
	) {
		this.data.wsMessageEvent = callback

		return this
	}

	/**
	 * Add a Callback for Closing WebSockets
	 * @since 5.7.0
	*/ wsClose(
		/** The Function to Call on a Closed WebSocket */ callback: MiddlewareData<Config, Context>['wsCloseEvent']
	) {
		this.data.wsCloseEvent = callback

		return this
	}


	/**
	 * Get the Production Version of this Class (required to load)
	 * @since 5.7.0
	*/ build(): MiddlewareProduction<Config, Context> {
		return {
			init: (config) => ({
				data: this.data,
				config, version: this.version,
				localContext: this.context,
			})
		}
	}
}