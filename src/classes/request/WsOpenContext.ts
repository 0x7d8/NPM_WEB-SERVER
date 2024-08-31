import InternalRequestContext from "@/types/internal/classes/RequestContext"
import { Content } from "@/types/global"
import Base from "@/classes/request/Base"
import { WsContext } from "@/types/implementation/contexts/ws"
import parseContent from "@/functions/parseContent"
import Channel from "@/classes/Channel"
import Server from "@/classes/Server"

export default class WsOpenContext<Type extends 'open' | 'message' = 'open', Context extends Record<any, any> = {}> extends Base<Context> {
	constructor(context: InternalRequestContext, server: Server<any, any>, protected rawContext: WsContext, protected abort: AbortSignal, type: Type = 'open' as Type) {
		super(context, server)

		this.type = type
	}

	/**
	 * The Type of this Websocket Event
	 * @since 5.7.0
	*/ public readonly type: Type

	/**
	 * Websocket Close (Abort) Controller (please use to decrease server load)
	 * @since 9.0.0
	*/ public $abort(callback?: () => void): boolean {
		if (callback) this.abort.addEventListener('abort', callback)

		return this.abort.aborted
	}

	/**
	 * Close the Socket and send a Code + Message to the Client (automatically Formatted)
	 * 
	 * This will instantly close the socket connection with a status code and
	 * message of choice, after calling and successfully closing the `.onClose()`
	 * callback will be called to finish the task.
	 * @example
	 * ```
	 * ctr.close(1011, 'An Error has occured')
	 * ```
	 * @since 5.4.0
	*/ public close(code?: number, reason?: string): this {
		this.rawContext.close(code, reason)

		return this
	}

	/**
	 * Print a Message to the Client (automatically Formatted)
	 * 
	 * This Message will instantly sent to the client, since this
	 * is a websocket, this also means that the message cannot be
	 * overriden after this function is called.
	 * @example
	 * ```
	 * await ctr.print({
	 *   message: 'this is json!'
	 * })
	 * 
	 * // content will be `{"message":"this is json!"}`
	 * 
	 * /// or
	 * 
	 * await ctr.print({
	 *   message: 'this is json!'
	 * }, true)
	 * // content will be `{\n  "message": "this is json!"\n}`
	 * 
	 * /// or
	 * 
	 * await ctr.print('this is text!')
	 * // content will be `this is text!`
	 * ```
	 * @since 5.4.0
	*/ public async print(type: 'text' | 'binary', content: Content, prettify: boolean = false): Promise<this> {
		const parsed = await parseContent(content, prettify)

		this.rawContext.write(type, parsed.content, this.global.options.compression.ws.enabled && this.global.options.compression.ws.maxSize > parsed.content.byteLength)

		return this
	}

	/**
	 * Print a Raw Message to the Client (ArrayBuffer only)
	 * 
	 * Same as `.print()` but only accepts ArrayBuffer as the content and therefore
	 * skips the parsing process. This is useful for sending data synchronously.
	 * @example
	 * ```
	 * const buffer = new ArrayBuffer(10)
	 * 
	 * ctr.printRaw('binary', buffer)
	 * ```
	 * @since 9.8.0
	*/ public printRaw(type: 'text' | 'binary', content: ArrayBuffer): this {
		this.rawContext.write(type, content, this.global.options.compression.ws.enabled && this.global.options.compression.ws.maxSize > content.byteLength)

		return this
	}

	/**
	 * Print a channels value to the client
	 * 
	 * This will print when the provided channel has a new value,
	 * basically subscribing to the channel.
	 * @example
	 * ```
	 * const channel = new Channel<string>()
	 * 
	 * ctr.printChannel(channel)
	 * 
	 * ref.send('text', 'Ok')
	 * ```
	 * @since 9.0.0
	*/ public printChannel(channel: Channel<Content>): this {
		if (!channel['onPublish']) {
			this.context.global.channels.push(channel)
			channel['onPublish'] = (type, data) => {
				this.context.global.implementation.wsPublish(type, channel.id, data, this.global.options.compression.ws.enabled && this.global.options.compression.ws.maxSize > data.byteLength)
			}
		}

		this.rawContext.subscribe(channel.id)

		return this
	}

	/**
	 * Remove a channel from the client
	 * 
	 * This will remove the subscription to the channel
	 * from the client. No more messages will be sent.
	 * @example
	 * ```
	 * const channel = new Channel<string>()
	 * 
	 * ctr.printChannel(channel)
	 * 
	 * ref.send('Ok')
	 * 
	 * ctr.removeChannel(channel)
	 * 
	 * ref.send('No') // will not be sent
	 * ```
	 * @since 9.0.0
	*/ public removeChannel(channel: Channel<Content>): this {
		this.rawContext.unsubscribe(channel.id)

		return this
	}

	/**
	 * Print a raw channels value to the client
	 * 
	 * This will print when the provided channel has a new value,
	 * basically subscribing to the channel. This uses strings to
	 * identify the channel instead of the channel object. (CAUTION)
	 * @example
	 * ```
	 * ctr.printRawChannel('channel')
	 * 
	 * await ctr.$channel('channel').print('text', 'Ok')
	 * ```
	 * @since 9.8.0
	*/ public printRawChannel(channel: string): this {
		const channelObj = this.context.global.internalChannelStringIdentifiers.get(channel)
		if (!channelObj) {
			this.context.global.internalChannelStringIdentifiers.set(channel, new Channel())
		}

		this.rawContext.subscribe((channelObj || this.context.global.internalChannelStringIdentifiers.get(channel))!.id)

		return this
	}

	/**
	 * Remove a raw channel from the client
	 * 
	 * This will remove the subscription to the channel
	 * from the client. No more messages will be sent. This
	 * uses strings to identify the channel instead of the
	 * channel object. (CAUTION)
	 * @example
	 * ```
	 * ctr.printRawChannel('channel')
	 * 
	 * await ctr.$channel('channel').print('text', 'Ok')
	 * 
	 * ctr.removeRawChannel('channel')
	 * 
	 * await ctr.$channel('channel').print('text', 'No') // will not be sent
	 * ```
	 * @since 9.8.0
	*/ public removeRawChannel(channel: string): this {
		this.rawContext.unsubscribe(this.context.global.internalChannelStringIdentifiers.get(channel)!.id)

		return this
	}
}