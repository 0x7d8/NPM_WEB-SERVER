import { UsableMiddleware } from "@/classes/Middleware"
import RuntimeError from "@/classes/RuntimeError"
import Base from "@/classes/request/Base"
import HttpRequestContext from "@/classes/request/HttpRequestContext"
import WsCloseContext from "@/classes/request/WsCloseContext"
import WsMessageContext from "@/classes/request/WsMessageContext"
import WsOpenContext from "@/classes/request/WsOpenContext"
import location from "@/functions/location"
import { Method } from "@/types/global"
import { z } from "zod"

export type RealAny = Promise<any> | any
export type EndFn = (...args: any[]) => void

export type SetItemType<S> = S extends Set<infer T> ? T : never

export type UnionToIntersection<U> =
  (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never

export type LocationCallback = (l: typeof location) => string[]

export type ZodResponse<Schema extends z.ZodTypeAny> = [z.infer<Schema>, null] | [null, z.ZodError<z.infer<Schema>>]
export type AnyClass = new (...args: any[]) => any

export type DataContext<Type extends keyof UsableMiddleware['classContexts'], HTTPMethod extends Method, Request extends object, Middlewares extends UsableMiddleware[]>
  = (Request extends HttpRequestContext ? HTTPMethod extends 'GET' ? Omit<Request, 'body' | 'rawBody' | 'rawBodyBytes' | 'bindBody'> : Request : Request)
    & Omit<UnionToIntersection<InstanceType<ReturnType<Middlewares[number]['classContexts'][Type]>>>, keyof InstanceType<ClassContexts[Type]>>

export type RateLimitConfig = {
  sortTo: number
  penalty: number
  timeWindow: number
  maxHits: number
}

export type ErrorCallbacks<Middlewares extends UsableMiddleware[], Context extends Record<string, any>> = {
	httpRequest?(ctr: DataContext<'HttpRequest', 'GET', HttpRequestContext<Context>, Middlewares>, error: RuntimeError): RealAny

	wsOpen?(ctr: DataContext<'WsOpen', 'GET', WsOpenContext<'open', Context>, Middlewares>, error: RuntimeError): RealAny
	wsMessage?(ctr: DataContext<'WsMessage', 'GET', WsMessageContext<Context>, Middlewares>, error: RuntimeError): RealAny
	wsClose?(ctr: DataContext<'WsClose', 'GET', WsCloseContext<Context>, Middlewares>, error: RuntimeError): RealAny
}

export type FinishCallbacks<Middlewares extends UsableMiddleware[], Context extends Record<string, any>> = {
	httpRequest?(ctr: DataContext<'HttpRequest', 'GET', Base<Context>, Middlewares>, ms: number): RealAny

	wsOpen?(ctr: DataContext<'WsOpen', 'GET', Base<Context>, Middlewares>, ms: number): RealAny
	wsMessage?(ctr: DataContext<'WsMessage', 'GET', Base<Context>, Middlewares>, ms: number): RealAny
	wsClose?(ctr: DataContext<'WsClose', 'GET', Base<Context>, Middlewares>, ms: number): RealAny
}

export type RatelimitCallbacks<Middlewares extends UsableMiddleware[], Context extends Record<string, any>> = {
  httpRequest?(ctr: DataContext<'HttpRequest', 'GET', HttpRequestContext<Context>, Middlewares>): RealAny

  wsMessage?(ctr: DataContext<'WsMessage', 'GET', WsMessageContext<Context>, Middlewares>): RealAny
}

export type ClassContexts = {
	HttpRequest: typeof HttpRequestContext
	WsOpen: typeof WsOpenContext
	WsMessage: typeof WsMessageContext
	WsClose: typeof WsCloseContext
}