import InternalRequestContext from "@/types/internal/classes/RequestContext"
import { WsContext } from "@/types/implementation/contexts/ws"
import WsOpenContext from "@/classes/request/WsOpenContext"
import { JSONParsed, ParsedBody, RatelimitInfos } from "@/types/global"
import Server from "@/classes/Server"

export default class WsMessageContext<Context extends Record<any, any> = {}> extends WsOpenContext<'message', Context> {
	constructor(context: InternalRequestContext, server: Server<any, any>, rawContext: WsContext, abort: AbortSignal) {
		super(context, server, rawContext, abort, 'message')
	}

	/**
	 * The Request Message as a Blob-like Object
	 * @example
	 * ```
	 * const size = await ctr.$message().size()
	 * 
	 * return ctr.print(`The size of the message is ${size} bytes`)
	 * ```
	 * @since 9.7.0
	*/ public $message() {
		const self = this

		return {
			text() {
				return self.rawMessage('utf-8')
			}, json(): JSONParsed {
				const data = self.message()

				if (self.context.body.type === 'json') return data as JSONParsed
				throw new Error('Message is not valid JSON')
			}, arrayBuffer() {
				return self.rawMessageBytes()
			}, blob(): Blob {
				return new Blob([ self.rawMessageBytes() ])
			}, size(): number {
				return self.rawMessageBytes().byteLength
			}
		}
	}

	/**
	 * The Websocket Message (JSON Automatically parsed if enabled)
	 * @since 5.4.0
	*/ public message(): ParsedBody {
		const stringified = this.context.body.raw!.toString()

		if (
			(stringified[0] === '{' && stringified[stringified.length - 1] === '}') ||
			(stringified[0] === '[' && stringified[stringified.length - 1] === ']')
		) {
			try {
				const json = JSON.parse(stringified)

				this.context.body.type = 'json'
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

	/**
	 * Skips counting the request to the Client IPs Rate limit (if there is one)
	 * 
	 * When a specific IP makes sends a message to an endpoint under a ratelimit, the maxhits will be
	 * increased instantly to prevent bypassing the rate limit by spamming messages faster than the host can
	 * handle. When this function is called, the server removes the set hit again.
	 * @since 8.6.0
	*/ public skipRateLimit(): this {
		if (!this.context.route || !this.context.route.ratelimit || this.context.route.ratelimit.maxHits === Infinity) return this

		const data = this.context.global.rateLimits.get(`ws+${this.client.ip.usual()}-${this.context.route.ratelimit.sortTo}`, {
			hits: 1,
			end: Date.now() + this.context.route.ratelimit.timeWindow
		})

		this.context.global.rateLimits.set(`ws+${this.client.ip.usual()}-${this.context.route.ratelimit.sortTo}`, {
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
		if (!this.context.route || !this.context.route.ratelimit || this.context.route.ratelimit.maxHits === Infinity) return this

		this.context.global.rateLimits.delete(`ws+${this.client.ip.usual()}-${this.context.route.ratelimit.sortTo}`)

		return this
	}

	/**
	 * Get Infos about the current Ratelimit
	 * 
	 * This will get all information about the currently applied ratelimit
	 * to the socket. If none is active, will return `null`.
	*/ public getRateLimit(): RatelimitInfos | null {
		if (!this.context.route || !this.context.route.ratelimit || this.context.route.ratelimit.maxHits === Infinity) return null

		const data = this.context.global.rateLimits.get(`ws+${this.client.ip}-${this.context.route.ratelimit.sortTo}`, {
			hits: 0,
			end: Date.now() + this.context.route.ratelimit.timeWindow
		})

		return {
			hits: data.hits,
			maxHits: this.context.route.ratelimit.maxHits,
			hasPenalty: data.hits > this.context.route.ratelimit.maxHits,
			penalty: this.context.route.ratelimit.penalty,
			timeWindow: this.context.route.ratelimit.timeWindow,
			get endsAt() { return new Date(data.end) },
			endsIn: data.end - Date.now()
		}
	}
}