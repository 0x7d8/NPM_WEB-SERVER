import Server from "../server"
import { LocalContext } from "../../types/context"
import Base from "./Base"
import { WebSocket } from "@rjweb/uws"
import { WebSocketContext } from "../../types/webSocket"
import parseContent, { Content, ParseContentReturns } from "../../functions/parseContent"
import { Readable } from "stream"
import Reference from "../reference"

export default class WSConnect<Context extends Record<any, any> = {}, Type = 'connect', Path extends string = '/'> extends Base<Context, Path> {
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
	*/ public readonly type: Type = 'connect' as any

	/**
	 * The Raw HTTP Server Ws Variable
	 * @since 7.0.0
	*/ public readonly rawWs: WebSocket<WebSocketContext>



	/**
	 * Close the Socket and send a Code + Message to the Client (automatically Formatted)
	 * 
	 * This will instantly close the socket connection with a status code and
	 * message of choice, after calling and successfully closing the `.onClose()`
	 * callback will be called to finish the task.
	 * @example
	 * ```
	 * ctr.close(401, {
	 *   message: 'this is json!'
	 * })
	 * 
	 * // or
	 * 
	 * ctr.close(401, 'this is text!')
	 * ```
	 * @since 5.4.0
	*/ public close(code: number, message?: Content): this {
		this.ctx.continueSend = false

		{(async() => {
			let result: ParseContentReturns
			try {
				result = await parseContent(message, false, this.ctg.logger)
			} catch (err) {
				this.ctx.handleError(err)
				return true
			}

			try {
				this.rawWs.cork(() => this.rawWs.end(code, result.content))
			} catch { }

			return true
		}) ()}

		return this
	}

	/**
	 * Print a Message to the Client (automatically Formatted)
	 * 
	 * This will send a new websocket message to the client as soon
	 * as the event loop allows it to execute the async task of parsing
	 * the message content.
	 * @example
	 * ```
	 * ctr.print({
	 *   message: 'this is json!'
	 * })
	 * 
	 * // or
	 * 
	 * ctr.print('this is text!')
	 * ```
	 * @since 5.4.0
	*/ public print(message: Content, options: {
		/**
		 * Whether to prettify output (mostly just JSONs)
		 * @default false
		 * @since 6.2.0
		*/ prettify?: boolean
	} = {}): this {
		const prettify = options?.prettify ?? false

		{(async() => {
			let result: ParseContentReturns
			try {
				result = await parseContent(message, prettify, this.ctg.logger)
			} catch (err) {
				this.ctx.handleError(err)
				return true
			}

			try {
				this.rawWs.cork(() => this.rawWs.send(result.content))
				this.ctg.webSockets.messages.outgoing.increase()
				this.ctg.data.outgoing.increase(result.content.byteLength)
			} catch { }

			return true
		}) ()}

		return this
	}

	/**
	 * Print a references value every time it changes
	 * 
	 * This will print when the provided reference changes state similarly
	 * to the `.printStream()` method which listen to a streams `data` event.
	 * @example
	 * ```
	 * const ref = new Reference('Hello')
	 * 
	 * ctr.printRef(ref)
	 * 
	 * ref.set('Ok')
	 * ```
	 * @since 7.2.0
	*/ public printRef<Ref extends Reference>(reference: Ref, options: {
		/**
		 * Whether to prettify output (currently just JSONs)
		 * @default false
		 * @since 7.4.0
		*/ prettify?: boolean
		/**
		 * Validate Function to determine whether a message should be sent
		 * @default () => true
		 * @since 8.4.4
		*/ validate?: (message: Ref extends Reference<infer T> ? T : never) => Promise<boolean> | boolean
	} = {}): this {
		const prettify = options?.prettify ?? false
		const validate = options?.validate?? (() => true)

		const ref = reference['onChange'](async(value) => {
			try {
				if (!await Promise.resolve(validate(value as any))) return
			} catch (err) {
				return this.ctx.handleError(err)
			}

			let data: Buffer

			try {
				data = (await parseContent(value, prettify, this.ctg.logger)).content
			} catch (err) {
				return this.ctx.handleError(err)
			}

			try {
				this.rawWs.send(data)
				this.ctg.webSockets.messages.outgoing.increase()
				this.ctg.data.outgoing.increase(data.byteLength)
			} catch { }
		})
				
		this.ctx.refListeners.push({
			ref: reference,
			refListener: ref
		})

		return this
	}

	/**
	 * Remove a reference subscription
	 * 
	 * This will remove the listener of a reference from the
	 * current socket. May be slow when having many references
	 * attached to the socket.
	 * @example
	 * ```
	 * const ref = new Reference('Hello')
	 * 
	 * ctr.printRef(ref)
	 * 
	 * ref.set('Ok')
	 * 
	 * ctr.removeRef(ref)
	 * ```
	 * @since 7.2.0
	*/ public removeRef(reference: Reference): this {
		const index = this.ctx.refListeners.findIndex(({ ref }) => Object.is(ref, reference))

		if (index >= 0) {
			reference['removeOnChange'](this.ctx.refListeners[index].refListener)

			this.ctx.refListeners.splice(index, 1)
		}

		return this
	}

	/**
	 * Print the `data` event of a Stream to the Client
	 * 
	 * This will print the `data` event of a stream to the client
	 * in real time. This shouldnt be used over `.printRef()` but is
	 * useful when working with something like a `fs.ReadStream` for
	 * some reason.
	 * @example
	 * ```
	 * const fileStream = fs.createReadStream('./profile.png')
	 * ctr.printStream(fileStream)
	 * ```
	 * @since 5.4.0
	*/ public printStream(stream: Readable, options: {
		/**
		 * Whether to prettify output (currently just JSONs)
		 * @default false
		 * @since 7.4.0
		*/ prettify?: boolean
		/**
		 * Whether to Destroy the Stream if the Socket gets closed
		 * @default true
		 * @since 5.4.0
		*/ destroyAbort?: boolean
		/**
		 * Validate Function to determine whether a message should be sent
		 * @default () => true
		 * @since 8.4.4
		*/ validate?: (message: any) => Promise<boolean> | boolean
	} = {}): this {
		const prettify = options?.prettify ?? false
		const destroyAbort = options?.destroyAbort ?? true
		const validate = options?.validate?? (() => true)

		stream.setMaxListeners(Infinity)

		const destroyStream = () => {
			stream.destroy()
		}

		const dataListener = async(data: Buffer) => {
			if (!await Promise.resolve(validate(data))) return

			try {
				data = (await parseContent(data, prettify, this.ctg.logger)).content
			} catch (err) {
				return this.ctx.handleError(err)
			}

			try {
				this.rawWs.send(data)
				this.ctg.webSockets.messages.outgoing.increase()
				this.ctg.data.outgoing.increase(data.byteLength)
			} catch { }
		}, closeListener = () => {
			if (destroyAbort) this.ctx.events.unlist('requestAborted', destroyStream)
		}, errorListener = (error: Error) => {
			this.ctx.handleError(error)
			stream
				.removeListener('data', dataListener)
				.removeListener('close', closeListener)
				.removeListener('error', errorListener)
		}

		if (destroyAbort) this.ctx.events.listen('requestAborted', destroyStream)
	
		stream
			.on('data', dataListener)
			.once('close', closeListener)
			.once('error', errorListener)

		this.ctx.events.listen('requestAborted', () => stream
			.removeListener('data', dataListener)
			.removeListener('close', closeListener)
			.removeListener('error', errorListener)
		)

		return this
	}
}