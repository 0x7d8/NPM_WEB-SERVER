import Server from "../server"
import { LocalContext } from "../../types/context"
import Base from "./Base"
import { WebSocket } from "@rjweb/uws"
import { WebSocketContext } from "../../types/webSocket"

export default class WSClose<Context extends Record<any, any> = {}, Message = unknown, Path extends string = '/'> extends Base<Context, Path> {
	/**
	 * Initializes a new Instance of a Web Context
	 * @since 7.0.0
	*/ constructor(controller: Server<any, any>, localContext: LocalContext, ws: WebSocket<WebSocketContext>) {
		super(controller, localContext)

		this.rawWs = ws
	}

	/**
	 * The Type of this Request
	 * @since 5.7.0
	*/ public readonly type = 'close'

	/**
	 * The Raw HTTP Server Ws Variable
	 * @since 7.0.0
	*/ public readonly rawWs: WebSocket<WebSocketContext>



	/**
	 * The Socket Message (JSON Automatically parsed if enabled)
	 * @since 5.4.0
	*/ public get message(): Message {
		if (!this.ctx.body.parsed) {
			const stringified = this.ctx.body.raw.toString()

			try { this.ctx.body.parsed = JSON.parse(stringified) }
			catch { this.ctx.body.parsed = stringified }
		}

		return this.ctx.body.parsed
	}

	/**
	 * The Raw Socket Message
	 * @since 5.5.2
	*/ public get rawMessage(): string {
		return this.ctx.body.raw.toString()
	}

	/**
	 * The Raw Socket Message as Buffer
	 * @since 8.1.4
	*/ public get rawMessageBytes(): Buffer {
		return this.ctx.body.raw
	}
}