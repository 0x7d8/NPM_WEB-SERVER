import InternalRequestContext from "@/types/internal/classes/RequestContext"
import { WsContext } from "@/types/implementation/contexts/ws"
import WsOpenContext from "@/classes/request/WsOpenContext"
import { ParsedBody } from "@/types/global"

export default class WsMessageContext<Context extends Record<any, any> = {}> extends WsOpenContext<Context> {
	constructor(context: InternalRequestContext, rawContext: WsContext, abort: AbortSignal) {
		super(context, rawContext, abort)
	}

	/**
	 * The Type of this Websocket Event
	 * @since 5.7.0
	*/ public override readonly type = 'message' as any

	/**
	 * The Websocket Message (JSON Automatically parsed if enabled)
	 * @since 5.4.0
	*/ public message(): ParsedBody {
		const stringified = this.context.body.raw!.toString()

		if ((stringified.startsWith('{') && stringified.endsWith('}')) || (stringified.startsWith('[') && stringified.endsWith(']'))) {
			try {
				const json = JSON.parse(stringified)

				this.context.body.parsed = json
			} catch {
				this.context.body.parsed = stringified
			}
		}

		return this.context.body.parsed
	}

	/**
	 * The Websocket Message Type
	 * @since 9.0.0
	*/ public messageType(): 'text' | 'binary' {
		return this.rawContext.messageType()
	}

	/**
	 * The Raw Websocket Message
	 * @since 5.5.2
	*/ public rawMessage(encoding: BufferEncoding): string {
		return this.context.body.raw!.toString(encoding)
	}

	/**
	 * The Raw Socket Message as Buffer
	 * @since 8.1.4
	*/ public rawMessageBytes(): Buffer {
		return this.context.body.raw!
	}
}