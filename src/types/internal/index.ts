import { UsableMiddleware } from "@/classes/Middleware"
import RuntimeError from "@/classes/RuntimeError"
import Base from "@/classes/request/Base"
import HttpRequestContext from "@/classes/request/HttpRequestContext"
import WsCloseContext from "@/classes/request/WsCloseContext"
import WsMessageContext from "@/classes/request/WsMessageContext"
import WsOpenContext from "@/classes/request/WsOpenContext"
import { Method } from "@/types/global"
import { z } from "zod"

export type RealAny = Promise<any> | any
export type EndFn = (...args: any[]) => void

export type UnionToIntersection<U> =
  (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never  
	
export type ZodResponse<Schema extends z.ZodTypeAny> = [z.infer<Schema>, null] | [null, z.ZodError<z.infer<Schema>>]
export type AnyClass = new (...args: any[]) => any

export type DataContext<Type extends keyof UsableMiddleware['classContexts'], HTTPMethod extends Method, Request extends object, Middlewares extends UsableMiddleware[]>
  = (Request extends HttpRequestContext ? HTTPMethod extends 'GET' ? Omit<Request, 'body' | 'rawBody' | 'rawBodyBytes' | 'bindBody'> : Request : Request)
    & UnionToIntersection<InstanceType<ReturnType<Middlewares[number]['classContexts'][Type]>>>

export type RateLimitConfig = {
  sortTo: number
  penalty: number
  timeWindow: number
  maxHits: number
}

export type ErrorCallbacks<Middlewares extends UsableMiddleware[]> = {
	httpRequest?(ctr: DataContext<'HttpRequest', 'GET', HttpRequestContext, Middlewares>, error: RuntimeError): RealAny

	wsOpen?(ctr: DataContext<'WsOpen', 'GET', WsOpenContext, Middlewares>, error: RuntimeError): RealAny
	wsMessage?(ctr: DataContext<'WsMessage', 'GET', WsMessageContext, Middlewares>, error: RuntimeError): RealAny
	wsClose?(ctr: DataContext<'WsClose', 'GET', WsCloseContext, Middlewares>, error: RuntimeError): RealAny
}

export type FinishCallbacks<Middlewares extends UsableMiddleware[]> = {
	httpRequest?(ctr: DataContext<'HttpRequest', 'GET', Base, Middlewares>, ms: number): RealAny

	wsOpen?(ctr: DataContext<'WsOpen', 'GET', Base, Middlewares>, ms: number): RealAny
	wsMessage?(ctr: DataContext<'WsMessage', 'GET', Base, Middlewares>, ms: number): RealAny
	wsClose?(ctr: DataContext<'WsClose', 'GET', Base, Middlewares>, ms: number): RealAny
}

export type RatelimitCallbacks<Middlewares extends UsableMiddleware[]> = {
  httpRequest?(ctr: DataContext<'HttpRequest', 'GET', HttpRequestContext, Middlewares>): RealAny

  wsMessage?(ctr: DataContext<'WsMessage', 'GET', WsMessageContext, Middlewares>): RealAny
}

export type ClassContexts = {
	HttpRequest: typeof HttpRequestContext
	WsOpen: typeof WsOpenContext
	WsMessage: typeof WsMessageContext
	WsClose: typeof WsCloseContext
}