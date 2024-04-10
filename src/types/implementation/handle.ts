import { HttpContext } from "@/types/implementation/contexts/http"
import { WsContext } from "@/types/implementation/contexts/ws"
import RequestContext from "@/types/internal/classes/RequestContext"

export type WebsocketData = {
	context: RequestContext
	custom: Record<string, any>
	aborter: AbortController
}

export type HandleRecord = {
	http: HttpContext
	ws: WsContext
}