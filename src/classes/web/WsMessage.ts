import Server from "../webServer"
import { LocalContext } from "../../types/context"
import WSConnect from "./WsConnect"
import { WebSocket } from "@rjweb/uws"
import { WebSocketContext } from "../../types/webSocket"

export default class WSMessage<Context extends Record<any, any> = {}, Message = unknown> extends WSConnect<Context, 'message'> {
	/**
	 * Initializes a new Instance of a Web Context
	 * @since 7.0.0
	*/ constructor(controller: Server<any>, localContext: LocalContext, ws: WebSocket<WebSocketContext>) {
		super(controller, localContext, ws)
	}

	/**
	 * The Type of this Request
	 * @since 5.7.0
	*/ public readonly type = 'message'



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
}