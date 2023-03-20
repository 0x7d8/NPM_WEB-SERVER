import { HTTPRequestContext } from "./external"

interface RuntimeError {
	/** The Name of the Event */ name: 'runtimeError'
	/** The Code to run when the Event occurs */ code: (ctr: HTTPRequestContext, err: Error) => Promise<any> | any
}

interface HttpRequest {
	/** The Name of the Event */ name: 'httpRequest'
	/** The Code to run when the Event occurs */ code: (ctr: HTTPRequestContext) => Promise<any> | any
}

interface Http404 {
	/** The Name of the Event */ name: 'http404'
	/** The Code to run when the Event occurs */ code: (ctr: HTTPRequestContext) => Promise<any> | any
}

type EventHandlerMap = {
	runtimeError: RuntimeError['code']
	httpRequest: HttpRequest['code']
	http404: Http404['code']
}

type Event = RuntimeError | HttpRequest | Http404
type Events = Event['name']

export { EventHandlerMap, Events }
export default Event