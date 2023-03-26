import { HTTPRequestContext } from "./external"
import { WebSocketConnect, WebSocketMessage, WebSocketClose } from "./webSocket"

interface RuntimeError {
	/** The Name of the Event */ name: 'runtimeError'
	/** The Code to run when the Event occurs */ code(ctr: HTTPRequestContext, err: Error): Promise<any> | any
}

interface WsConnectError {
	/** The Name of the Event */ name: 'wsConnectError'
	/** The Code to run when the Event occurs */ code(ctr: WebSocketConnect, err: Error): Promise<any> | any
}

interface WsMessageError {
	/** The Name of the Event */ name: 'wsMessageError'
	/** The Code to run when the Event occurs */ code(ctr: WebSocketMessage, err: Error): Promise<any> | any
}

interface WsCloseError {
	/** The Name of the Event */ name: 'wsCloseError'
	/** The Code to run when the Event occurs */ code(ctr: WebSocketClose, err: Error): Promise<any> | any
}

interface HttpRequest {
	/** The Name of the Event */ name: 'httpRequest'
	/** The Code to run when the Event occurs */ code(ctr: HTTPRequestContext): Promise<any> | any
}

interface Http404 {
	/** The Name of the Event */ name: 'http404'
	/** The Code to run when the Event occurs */ code(ctr: HTTPRequestContext): Promise<any> | any
}

type EventHandlerMap = {
	runtimeError: RuntimeError['code']
	wsConnectError: WsConnectError['code']
	wsMessageError: WsMessageError['code']
	wsCloseError: WsCloseError['code']
	httpRequest: HttpRequest['code']
	http404: Http404['code']
}

type Event = RuntimeError | WsConnectError | WsMessageError | WsCloseError | HttpRequest | Http404
type Events = Event['name']

export { EventHandlerMap, Events }
export default Event