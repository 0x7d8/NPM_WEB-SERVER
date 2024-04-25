import { AnyClass, EndFn, RealAny } from "@/types/internal"

import HttpRequestContext from "@/classes/request/HttpRequestContext"
import WsOpenContext from "@/classes/request/WsOpenContext"
import WsMessageContext from "@/classes/request/WsMessageContext"
import WsCloseContext from "@/classes/request/WsCloseContext"
import Server from "@/classes/Server"
import RequestContext from "@/types/internal/classes/RequestContext"
import GlobalContext from "@/types/internal/classes/GlobalContext"
import Base from "@/classes/request/Base"

export type UsableMiddleware<
	Config extends Record<any, any> = any,
	ModifiedHttpContext extends AnyClass = any,
	ModifiedWsOpenContext extends AnyClass = any,
	ModifiedWsMessageContext extends AnyClass = any,
	ModifiedWsCloseContext extends AnyClass = any
> = {
	NOTICE: 'DO NOT CALL MANUALLY, THIS IS FOR RJWEB INTERNALLY'
	classContexts: {
		HttpRequest(config: Config, Original: AnyClass): ModifiedHttpContext
		WsOpen(config: Config, Original: AnyClass): ModifiedWsOpenContext
		WsMessage(config: Config, Original: AnyClass): ModifiedWsMessageContext
		WsClose(config: Config, Original: AnyClass): ModifiedWsCloseContext
	}

	infos: {
		name: string
		version: string
	}

	rjwebVersion: number
	config: Config
	callbacks: {
		load?(config: Config, server: Server<any, any, any>, context: GlobalContext): RealAny
		httpRequest?(config: Config, server: Server<any, any, any>, context: RequestContext, ctr: HttpRequestContext & InstanceType<ModifiedHttpContext>, end: EndFn): RealAny
		wsOpen?(config: Config, server: Server<any, any, any>, context: RequestContext, ctr: WsOpenContext & InstanceType<ModifiedWsOpenContext>, end: EndFn): RealAny
		wsMessage?(config: Config, server: Server<any, any, any>, context: RequestContext, ctr: WsMessageContext & InstanceType<ModifiedWsMessageContext>, end: EndFn): RealAny
		wsClose?(config: Config, server: Server<any, any, any>, context: RequestContext, ctr: WsCloseContext & InstanceType<ModifiedWsCloseContext>, end: EndFn): RealAny
	}

	finishCallbacks: {
		httpRequest?(config: Config, server: Server<any, any, any>, context: RequestContext, ctr: Base, ms: number): RealAny
		wsOpen?(config: Config, server: Server<any, any, any>, context: RequestContext, ctr: Base, ms: number): RealAny
		wsMessage?(config: Config, server: Server<any, any, any>, context: RequestContext, ctr: Base, ms: number): RealAny
		wsClose?(config: Config, server: Server<any, any, any>, context: RequestContext, ctr: Base, ms: number): RealAny
	}
}

export const currentVersion = 9

class Dummy {}

export default class Middleware<
	Config extends Record<any, any> = {},
	InternalData extends Record<any, any> = {},
	ModifiedHttpContext extends AnyClass = typeof Dummy,
	ModifiedWsOpenContext extends AnyClass = typeof Dummy,
	ModifiedWsMessageContext extends AnyClass = typeof Dummy,
	ModifiedWsCloseContext extends AnyClass = typeof Dummy,
	Excluded extends (keyof Middleware)[] = []
> {
	private data: {
		classContexts: {
			HttpRequest(config: Config, Original: typeof HttpRequestContext): ModifiedHttpContext
			WsOpen(config: Config, Original: typeof WsOpenContext): ModifiedWsOpenContext
			WsMessage(config: Config, Original: typeof WsMessageContext): ModifiedWsMessageContext
			WsClose(config: Config, Original: typeof WsCloseContext): ModifiedWsCloseContext
		}, callbacks: UsableMiddleware['callbacks'],
		finishCallbacks: UsableMiddleware['finishCallbacks']
	} = {
		classContexts: {
			HttpRequest: () => HttpRequestContext as never,
			WsOpen: () => WsOpenContext as never,
			WsMessage: () => WsMessageContext as never,
			WsClose: () => WsCloseContext as never
		}, callbacks: {},
		finishCallbacks: {}
	}

	/**
	 * Build a new Middleware
	 * @example
	 * ```
	 * import { Middleware } from "rjweb-server"
	 * 
	 * const middleware = new Middleware<{ greeting: string }>('Say Hi', '1.0.0')
	 *   .httpRequest((config, server, context, ctr, end) => {
	 *     if (ctr.url.path.includes('hello')) end(ctr.print(config.greeting))
	 *   })
	 *   .export()
	 * ```
	 * @since 9.0.0
	*/ constructor(private name: string, private version: string) {}

	/**
	 * Callback that runs when the middleware is loaded (server starting, can be multiple times!)
	 * @since 9.0.0
	*/ public load(
		callback: (config: Config, server: Server<any, any, any>, context: GlobalContext) => RealAny
	): Omit<Middleware<Config, InternalData, ModifiedHttpContext, ModifiedWsOpenContext, ModifiedWsMessageContext, ModifiedWsCloseContext, [...Excluded, 'load']>, Excluded[number] | 'load'> {
		this.data.callbacks.load = callback

		return this as any
	}

	/**
	 * Callback that runs when any HTTP Request is made
	 * @since 9.0.0
	*/ public httpRequest(
		callback: (config: Config, server: Server<any, any, any>, context: RequestContext<InternalData>, ctr: HttpRequestContext & InstanceType<ModifiedHttpContext>, end: EndFn) => RealAny
	): Omit<Middleware<Config, InternalData, ModifiedHttpContext, ModifiedWsOpenContext, ModifiedWsMessageContext, ModifiedWsCloseContext, [...Excluded, 'httpRequest']>, Excluded[number] | 'httpRequest'> {
		this.data.callbacks.httpRequest = callback as never

		return this as any
	}

	/**
	 * Callback that runs when any HTTP Request finishes
	 * @since 9.0.0
	*/ public httpRequestFinish(
		callback: (config: Config, server: Server<any, any, any>, context: RequestContext<InternalData>, ctr: Base, ms: number) => RealAny
	): Omit<Middleware<Config, InternalData, ModifiedHttpContext, ModifiedWsOpenContext, ModifiedWsMessageContext, ModifiedWsCloseContext, [...Excluded, 'httpRequestFinish']>, Excluded[number] | 'httpRequestFinish'> {
		this.data.finishCallbacks.httpRequest = callback as never

		return this as any
	}

	/**
	 * Modify the HttpRequestContext Class to add new properties or methods for the user
	 * @since 9.0.0
	*/ public httpRequestContext<NewClass extends AnyClass>(
		callback: (config: Config, Original: typeof HttpRequestContext) => NewClass
	): Omit<Middleware<Config, InternalData, NewClass, ModifiedWsOpenContext, ModifiedWsMessageContext, ModifiedWsCloseContext, [...Excluded, 'httpRequestContext']>, Excluded[number] | 'httpRequestContext'> {
		this.data.classContexts.HttpRequest = callback as never

		return this as any
	}

	/**
	 * Callback that runs when any WebSocket Connection is opened
	 * @since 9.0.0
	*/ public wsOpen(
		callback: (config: Config, server: Server<any, any, any>, context: RequestContext<InternalData>, ctr: WsOpenContext & InstanceType<ModifiedWsOpenContext>, end: EndFn) => RealAny
	): Omit<Middleware<Config, InternalData, ModifiedHttpContext, ModifiedWsOpenContext, ModifiedWsMessageContext, ModifiedWsCloseContext, [...Excluded, 'wsOpen']>, Excluded[number] | 'wsOpen'> {
		this.data.callbacks.wsOpen = callback as never

		return this as any
	}

	/**
	 * Callback that runs when any WebSocket Connection is opened and finishes running all events
	 * @since 9.0.0
	*/ public wsOpenFinish(
		callback: (config: Config, server: Server<any, any, any>, context: RequestContext<InternalData>, ctr: Base, ms: number) => RealAny
	): Omit<Middleware<Config, InternalData, ModifiedHttpContext, ModifiedWsOpenContext, ModifiedWsMessageContext, ModifiedWsCloseContext, [...Excluded, 'wsOpenFinish']>, Excluded[number] | 'wsOpenFinish'> {
		this.data.finishCallbacks.wsOpen = callback as never

		return this as any
	}

	/**
	 * Modify the WsOpenContext Class to add new properties or methods for the user
	 * @since 9.0.0
	*/ public wsOpenContext<NewClass extends AnyClass>(
		callback: (config: Config, Original: typeof WsOpenContext) => NewClass
	): Omit<Middleware<Config, InternalData, ModifiedHttpContext, NewClass, ModifiedWsMessageContext, ModifiedWsCloseContext, [...Excluded, 'wsOpenContext']>, Excluded[number] | 'wsOpenContext'> {
		this.data.classContexts.WsOpen = callback as never

		return this as any
	}

	/**
	 * Callback that runs when any WebSocket Message is recieved
	 * @since 9.0.0
	*/ public wsMessage(
		callback: (config: Config, server: Server<any, any, any>, context: RequestContext<InternalData>, ctr: WsMessageContext & InstanceType<ModifiedWsMessageContext>, end: EndFn) => RealAny
	): Omit<Middleware<Config, InternalData, ModifiedHttpContext, ModifiedWsOpenContext, ModifiedWsMessageContext, ModifiedWsCloseContext, [...Excluded, 'wsMessage']>, Excluded[number] | 'wsMessage'> {
		this.data.callbacks.wsMessage = callback as never

		return this as any
	}

	/**
	 * Callback that runs when any WebSocket Message is recieved and finishes running all events
	 * @since 9.0.0
	*/ public wsMessageFinish(
		callback: (config: Config, server: Server<any, any, any>, context: RequestContext<InternalData>, ctr: Base, ms: number) => RealAny
	): Omit<Middleware<Config, InternalData, ModifiedHttpContext, ModifiedWsOpenContext, ModifiedWsMessageContext, ModifiedWsCloseContext, [...Excluded, 'wsMessageFinish']>, Excluded[number] | 'wsMessageFinish'> {
		this.data.finishCallbacks.wsMessage = callback as never

		return this as any
	}

	/**
	 * Modify the WsMessageContext Class to add new properties or methods for the user
	 * @since 9.0.0
	*/ public wsMessageContext<NewClass extends AnyClass>(
		callback: (config: Config, Original: typeof WsMessageContext) => NewClass
	): Omit<Middleware<Config, InternalData, ModifiedHttpContext, ModifiedWsOpenContext, NewClass, ModifiedWsCloseContext, [...Excluded, 'wsMessageContext']>, Excluded[number] | 'wsMessageContext'> {
		this.data.classContexts.WsMessage = callback as never

		return this as any
	}

	/**
	 * Callback that runs when any WebSocket Connection is closed
	 * @since 9.0.0
	*/ public wsClose(
		callback: (config: Config, server: Server<any, any, any>, context: RequestContext<InternalData>, ctr: WsCloseContext & InstanceType<ModifiedWsCloseContext>, end: EndFn) => RealAny
	): Omit<Middleware<Config, InternalData, ModifiedHttpContext, ModifiedWsOpenContext, ModifiedWsMessageContext, ModifiedWsCloseContext, [...Excluded, 'wsClose']>, Excluded[number] | 'wsClose'> {
		this.data.callbacks.wsClose = callback as never

		return this as any
	}

	/**
	 * Callback that runs when any WebSocket Connection is closed and finishes running all events
	 * @since 9.0.0
	*/ public wsCloseFinish(
		callback: (config: Config, server: Server<any, any, any>, context: RequestContext<InternalData>, ctr: Base, ms: number) => RealAny
	): Omit<Middleware<Config, InternalData, ModifiedHttpContext, ModifiedWsOpenContext, ModifiedWsMessageContext, ModifiedWsCloseContext, [...Excluded, 'wsCloseFinish']>, Excluded[number] | 'wsCloseFinish'> {
		this.data.finishCallbacks.wsClose = callback as never

		return this as any
	}

	/**
	 * Modify the WsCloseContext Class to add new properties or methods for the user
	 * @since 9.0.0
	*/ public wsCloseContext<NewClass extends AnyClass>(
		callback: (config: Config, Original: typeof WsCloseContext) => NewClass
	): Omit<Middleware<Config, InternalData, ModifiedHttpContext, ModifiedWsOpenContext, ModifiedWsMessageContext, NewClass, [...Excluded, 'wsCloseContext']>, Excluded[number] | 'wsCloseContext'> {
		this.data.classContexts.WsClose = callback as never

		return this as any
	}

	/**
	 * Export the Middleware for use in the Server
	 * @since 9.0.0
	*/ public export(): {
		use(config: Config): UsableMiddleware<Config, ModifiedHttpContext, ModifiedWsOpenContext, ModifiedWsMessageContext, ModifiedWsCloseContext>
	 } {
		const self = this

		return {
			use(config) {
				return {
					callbacks: self.data.callbacks,
					classContexts: self.data.classContexts,
					finishCallbacks: self.data.finishCallbacks,
					config,
					rjwebVersion: currentVersion,
					infos: {
						name: self.name,
						version: self.version
					}
				} satisfies Omit<UsableMiddleware, 'NOTICE'> as never
			}
		}
	}
}