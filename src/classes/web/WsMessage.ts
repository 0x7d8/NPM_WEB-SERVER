import Server from "../server"
import { LocalContext } from "../../types/context"
import WSConnect from "./WsConnect"
import { WebSocket } from "@rjweb/uws"
import { WebSocketContext } from "../../types/webSocket"
import { RatelimitInfos } from "../../types/external"

export default class WSMessage<Context extends Record<any, any> = {}, Message = unknown, Path extends string = '/'> extends WSConnect<Context, 'message', Path> {
	/**
	 * Initializes a new Instance of a Web Context
	 * @since 7.0.0
	*/ constructor(controller: Server<any, any>, localContext: LocalContext, ws: WebSocket<WebSocketContext>) {
		super(controller, localContext, ws)
	}

	/**
	 * The Type of this Request
	 * @since 5.7.0
	*/ public readonly type = 'message'



	/**
	 * The Type of the Socket Message
	 * @since 7.8.0
	*/ public get messageType(): LocalContext['body']['type'] {
		if (!this.ctx.body.parsed) this.message

		return this.ctx.body.type
	}

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


	/**
	 * Skips counting the request to the Client IPs Rate limit (if there is one)
	 * 
	 * When a specific IP makes sends a message to an endpoint under a ratelimit, the maxhits will be
	 * increased instantly to prevent bypassing the rate limit by spamming messages faster than the host can
	 * handle. When this function is called, the server removes the set hit again.
	 * @since 8.6.0
	*/ public skipRateLimit(): this {
		if (!this.ctx.execute.route || !('ratelimit' in this.ctx.execute.route.data) || this.ctx.execute.route.data.ratelimit.maxHits === Infinity) return this

		const data = this.ctg.rateLimits.get(`ws+${this.client.ip}-${this.ctx.execute.route.data.ratelimit.sortTo}`, {
			hits: 1,
			end: Date.now() + this.ctx.execute.route.data.ratelimit.timeWindow
		})

		this.ctg.rateLimits.set(`ws+${this.client.ip}-${this.ctx.execute.route.data.ratelimit.sortTo}`, {
			...data,
			hits: data.hits - 1
		})

		return this
	}

	/**
	 * Clear the active Ratelimit of the Client
	 * 
	 * This Clears the currently active Ratelimit (on this socket) of the Client, remember:
	 * you cant call this in a normal message callback if the max hits are already reached since well...
	 * they are already reached.
	 * @since 8.6.0
	*/ public clearRateLimit(): this {
		if (!this.ctx.execute.route || !('ratelimit' in this.ctx.execute.route.data) || this.ctx.execute.route.data.ratelimit.maxHits === Infinity) return this

		this.ctg.rateLimits.delete(`ws+${this.client.ip}-${this.ctx.execute.route.data.ratelimit.sortTo}`)

		return this
	}

	/**
	 * Get Infos about the current Ratelimit
	 * 
	 * This will get all information about the currently applied ratelimit
	 * to the socket. If none is active, will return `null`.
	*/ public getRateLimit(): RatelimitInfos | null {
		if (!this.ctx.execute.route || !('ratelimit' in this.ctx.execute.route.data) || this.ctx.execute.route.data.ratelimit.maxHits === Infinity) return null

		const data = this.ctg.rateLimits.get(`ws+${this.client.ip}-${this.ctx.execute.route.data.ratelimit.sortTo}`, {
			hits: 0,
			end: Date.now() + this.ctx.execute.route.data.ratelimit.timeWindow
		})

		return {
			hits: data.hits,
			maxHits: this.ctx.execute.route.data.ratelimit.maxHits,
			hasPenalty: data.hits > this.ctx.execute.route.data.ratelimit.maxHits,
			penalty: this.ctx.execute.route.data.ratelimit.penalty,
			timeWindow: this.ctx.execute.route.data.ratelimit.timeWindow,
			endsAt: new Date(data.end),
			endsIn: data.end - Date.now()
		}
	}
}