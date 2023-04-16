import { HTTPRequestContext } from "./external"
import { WebSocketConnect, WebSocketMessage, WebSocketClose } from "./webSocket"
import { RealAny, EndFn } from "./internal"

type HTTPRequest = (ctr: HTTPRequestContext, end: EndFn) => RealAny
type HTTPError = (ctr: HTTPRequestContext, error: unknown) => RealAny

type WSConnect = (ctr: WebSocketConnect, end: EndFn) => RealAny
type WSMessage = (ctr: WebSocketMessage, end: EndFn) => RealAny
type WSClose = (ctr: WebSocketClose, end: EndFn) => RealAny
type WSConnectError = (ctr: WebSocketConnect, error: unknown) => RealAny
type WSMessageError = (ctr: WebSocketMessage, error: unknown) => RealAny
type WSCloseError = (ctr: WebSocketClose, error: unknown) => RealAny

type Route404 = (ctr: HTTPRequestContext) => RealAny

export type EventHandlerMap = {
	httpRequest: HTTPRequest
	httpError: HTTPError

	wsConnect: WSConnect
	wsMessage: WSMessage
	wSClose: WSClose
	wsConnectError: WSConnectError
	wsMessageError: WSMessageError
	wsCloseError: WSCloseError

	route404: Route404
}