import type { HttpContext } from "@/types/implementation/contexts/http"
import type { WsContext } from "@/types/implementation/contexts/ws"
import type RequestContext from "@/types/internal/classes/RequestContext"

export type WebsocketData = {
	context: RequestContext
	custom: Record<string, any>
	aborter: AbortController
}

export type HandleRecord = {
	http: HttpContext
	ws: WsContext
}