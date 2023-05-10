import { HttpRequest, WsConnect, WsMessage, WsClose } from "./external"
import { RealAny, EndFn, MiddlewareInitted, MergeObjects } from "./internal"

type HTTPRequest<Context extends Record<any, any>, Middlewares extends MiddlewareInitted[]> = (ctr: MergeObjects<[ HttpRequest<Context, unknown>, InstanceType<Middlewares[number]['data']['classModifications']['http']> ]>, end: EndFn) => RealAny
type HTTPError<Context extends Record<any, any>, Middlewares extends MiddlewareInitted[]> = (ctr: MergeObjects<[ HttpRequest<Context, unknown>, InstanceType<Middlewares[number]['data']['classModifications']['http']> ]>, error: unknown) => RealAny

type WSConnect<Context extends Record<any, any>, Middlewares extends MiddlewareInitted[]> = (ctr: MergeObjects<[ WsConnect<Context, unknown>, InstanceType<Middlewares[number]['data']['classModifications']['wsConnect']> ]>, end: EndFn) => RealAny
type WSMessage<Context extends Record<any, any>, Middlewares extends MiddlewareInitted[]> = (ctr: MergeObjects<[ WsMessage<Context, unknown>, InstanceType<Middlewares[number]['data']['classModifications']['wsMessage']> ]>, end: EndFn) => RealAny
type WSClose<Context extends Record<any, any>, Middlewares extends MiddlewareInitted[]> = (ctr: MergeObjects<[ WsClose<Context, unknown>, InstanceType<Middlewares[number]['data']['classModifications']['wsClose']> ]>, end: EndFn) => RealAny
type WSConnectError<Context extends Record<any, any>, Middlewares extends MiddlewareInitted[]> = (ctr: MergeObjects<[ WsConnect<Context, unknown>, InstanceType<Middlewares[number]['data']['classModifications']['wsConnect']> ]>, error: unknown) => RealAny
type WSMessageError<Context extends Record<any, any>, Middlewares extends MiddlewareInitted[]> = (ctr: MergeObjects<[ WsMessage<Context, unknown>, InstanceType<Middlewares[number]['data']['classModifications']['wsMessage']> ]>, error: unknown) => RealAny
type WSCloseError<Context extends Record<any, any>, Middlewares extends MiddlewareInitted[]> = (ctr: MergeObjects<[ WsClose<Context, unknown>, InstanceType<Middlewares[number]['data']['classModifications']['wsClose']> ]>, error: unknown) => RealAny

type Route404<Context extends Record<any, any>, Middlewares extends MiddlewareInitted[]> = (ctr: MergeObjects<[ HttpRequest<Context, unknown>, InstanceType<Middlewares[number]['data']['classModifications']['http']> ]>) => RealAny

export type EventHandlerMap<Context extends Record<any, any>, Middlewares extends MiddlewareInitted[]> = {
	httpRequest: HTTPRequest<Context, Middlewares>
	httpError: HTTPError<Context, Middlewares>

	wsConnect: WSConnect<Context, Middlewares>
	wsMessage: WSMessage<Context, Middlewares>
	wsClose: WSClose<Context, Middlewares>
	wsConnectError: WSConnectError<Context, Middlewares>
	wsMessageError: WSMessageError<Context, Middlewares>
	wsCloseError: WSCloseError<Context, Middlewares>

	route404: Route404<Context, Middlewares>
}