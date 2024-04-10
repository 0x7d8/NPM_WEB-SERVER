import InternalRequestContext from "@/types/internal/classes/RequestContext"
import Base from "@/classes/request/Base"

export default class WsCloseContext<Context extends Record<any, any> = {}> extends Base<Context> {
	constructor(context: InternalRequestContext) {
		super(context)
	}

	/**
	 * The Type of this Websocket Event
	 * @since 5.7.0
	*/ public readonly type = 'close'
}