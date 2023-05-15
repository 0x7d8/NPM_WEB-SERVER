import Server from "../server"
import { LocalContext } from "../../types/context"
import Base from "./Base"
import { WebSocket } from "@rjweb/uws"
import { WebSocketContext } from "../../types/webSocket"
import parseContent, { Content, ParseContentReturns } from "../../functions/parseContent"
import { Readable } from "stream"
import Reference from "../reference"

export default class WSConnect<Context extends Record<any, any> = {}, Type = 'connect'> extends Base<Context> {
	/**
	 * Initializes a new Instance of a Web Context
	 * @since 7.0.0
	*/ constructor(controller: Server<any>, localContext: LocalContext, ws: WebSocket<WebSocketContext>) {
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

		this.ctx.setExecuteSelf(async() => {
			this.ctx.events.send('requestAborted')

			let result: ParseContentReturns
			try {
				result = await parseContent(message, false, this.ctg.logger)
			} catch (err) {
				this.ctx.handleError(err)
				return true
			}

			try {
				this.rawWs.end(code, result.content)
			} catch { }

			return true
		})

		return this
	}

	/**
	 * Print a Message to the Client (automatically Formatted)
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

		this.ctx.setExecuteSelf(async() => {
			let result: ParseContentReturns
			try {
				result = await parseContent(message, prettify, this.ctg.logger)
			} catch (err) {
				this.ctx.handleError(err)
				return true
			}

			try {
				this.rawWs.send(result.content)
				this.ctg.webSockets.messages.outgoing.increase()
				this.ctg.data.outgoing.increase(result.content.byteLength)
			} catch { }

			return true
		})

		return this
	}

	/**
	 * Print a references value every time it changes
	 * @example
	 * ```
	 * const ref = new Reference('Hello')
	 * 
	 * ctr.printRef(ref)
	 * 
	 * ref.set('Ok')
	 * ```
	 * @since 7.2.0
	*/ public printRef(reference: Reference, options: {
		/**
		 * Whether to prettify output (currently just JSONs)
		 * @default false
		 * @since 7.4.0
		*/ prettify?: boolean
	} = {}): this {
		const prettify = options?.prettify ?? false

		this.ctx.setExecuteSelf(() => new Promise((resolve) => {
			try {
				const ref = reference['onChange'](async(value) => {
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
					} catch {
						this.ctx.events.send('requestAborted')
					}
				})
				
				this.ctx.refListeners.push({
					ref: reference,
					refListener: ref
				})

				return resolve(true)
			} catch { }
		}))

		return this
	}

	/**
	 * Remove a reference subscription
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
	 * Print the data event of a Stream to the Client
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
	} = {}): this {
		const prettify = options?.prettify ?? false
		const destroyAbort = options?.destroyAbort ?? true

		this.ctx.setExecuteSelf(() => new Promise((resolve) => {
			try {
				const destroyStream = () => {
					stream.destroy()
				}

				const dataListener = async(data: Buffer) => {
					try {
						data = (await parseContent(data, prettify, this.ctg.logger)).content
					} catch (err) {
						return this.ctx.handleError(err)
					}

					try {
						this.rawWs.send(data)
						this.ctg.webSockets.messages.outgoing.increase()
						this.ctg.data.outgoing.increase(data.byteLength)
					} catch {
						this.ctx.events.send('requestAborted')
					}
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

				return resolve(true)
			} catch { }
		}))

		return this
	}
}