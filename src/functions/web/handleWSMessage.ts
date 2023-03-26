import { GlobalContext } from "../../types/context"
import { WebSocket } from "uWebSockets.js"
import { parse as parseQuery } from "querystring"
import parseContent, { Returns as ParseContentReturns } from "../parseContent"
import ValueCollection from "../../classes/valueCollection"
import { WebSocketContext, WebSocketMessage } from "../../types/webSocket"
import handleEvent from "../handleEvent"

export default function handleWSConnect(ws: WebSocket<WebSocketContext>, message: ArrayBuffer, ctg: GlobalContext) {
	let custom = ws.getUserData().custom
  let ctx = ws.getUserData().ctx
	ctx.body.raw = Buffer.from(message)
	ctx.continueSend = true
	ctx.queue = []

	ctg.data.incoming.total += message.byteLength
	ctg.data.incoming[ctx.previousHours[4]] += message.byteLength

	ctx.handleError = (err) => {
		ctx.error = err
		ctx.execute.event = 'wsMessageError'
	}

  {(async() => {
    // Get Correct Host IP
		let hostIp: string
		if (ctg.options.proxy && ctx.headers['x-forwarded-for']) hostIp = ctx.headers['x-forwarded-for']
		else hostIp = ctx.remoteAddress.split(':')[0]

		// Turn Cookies into Object
		let cookies = {}
		if (ctx.headers['cookie']) ctx.headers['cookie'].split(';').forEach((cookie) => {
			const parts = cookie.split('=')
			cookies[parts.shift().trim()] = parts.join('=')
		})

		// Parse Socket Message
		if (ctg.options.body.parse) {
			try { ctx.body.parsed = JSON.parse(ctx.body.raw.toString()) }
			catch (err) { ctx.body.parsed = ctx.body.raw.toString() }
		} else ctx.body.parsed = ctx.body.raw.toString()

		// Create Context Response Object
		let ctr: WebSocketMessage = {
			type: 'message',

			// Properties
			controller: ctg.controller,
			headers: new ValueCollection(ctx.headers, decodeURIComponent),
			cookies: new ValueCollection(cookies, decodeURIComponent),
			params: new ValueCollection(ws.getUserData().params, decodeURIComponent),
			queries: new ValueCollection(parseQuery(ctx.url.query) as any, decodeURIComponent),

			// Variables
			client: {
				userAgent: ctx.headers['user-agent'],
				port: Number(ctx.remoteAddress.split(':')[1]),
				ip: hostIp
			}, message: ctx.body.parsed,
			url: ctx.url,

			// Custom Variables
			'@': custom,

			// Functions
			setCustom(name, value) {
				ctr['@'][name] = value

				return ctr
			}, close(message) {
				ctx.continueSend = false

				ctx.scheduleQueue('execution', (async() => {
					ctx.events.emit('requestAborted')

					let result: ParseContentReturns
					try {
						result = await parseContent(message)
					} catch (err) {
						return ctx.handleError(err)
					}

					ws.cork(() => {
						ws.end(0, result.content)
					})
				}))

				return ctr
			}, print(content) {
				ctx.scheduleQueue('execution', (async() => {
					let result: ParseContentReturns
					try {
						result = await parseContent(content)
					} catch (err) {
						return ctx.handleError(err)
					}

					ctx.response.content = result.content
				}))

				return ctr
			}, printStream(stream, options = {}) {
				const endRequest = options?.endRequest ?? true
				const destroyAbort = options?.destroyAbort ?? true

				ctx.scheduleQueue('execution', () => new Promise<void>((resolve) => {
					ctx.continueSend = false

					try {
						ws.cork(() => {
							const destroyStream = () => {
								stream.destroy()
							}

							const dataListener = async(data: Buffer) => {
								try {
									data = (await parseContent(data)).content
								} catch (err) {
									return ctx.handleError(err)
								}
			
								try {
									ws.send(data)
								} catch { ctx.events.emit('requestAborted') }

								ctg.data.outgoing.total += data.byteLength
								ctg.data.outgoing[ctx.previousHours[4]] += data.byteLength
							}, closeListener = () => {
								if (destroyAbort) ctx.events.removeListener('requestAborted', destroyStream)
								if (endRequest) resolve()
							}, errorListener = (error: Error) => {
								ctx.handleError(error)
								stream
									.removeListener('data', dataListener)
									.removeListener('close', closeListener)
									.removeListener('error', errorListener)

								return resolve()
							}

							if (destroyAbort) ctx.events.once('requestAborted', destroyStream)
			
							stream
								.on('data', dataListener)
								.once('close', closeListener)
								.once('error', errorListener)

							ctx.events.once('requestAborted', () => stream
								.removeListener('data', dataListener)
								.removeListener('close', closeListener)
								.removeListener('error', errorListener))
						})
					} catch { }
				}))

				return ctr
			}
		}

		// Execute Page Logic
		const runPageLogic = (eventOnly?: boolean) => new Promise<void>(async(resolve) => {
			// Execute Event
			if (ctx.execute.event !== 'none') {
				await handleEvent(ctx.execute.event, ctr, ctx, ctg)
				return resolve()
			}; if (eventOnly) return resolve()

			// Execute Normal Route
			if ('onMessage' in ctx.execute.route && ctx.execute.route.type === 'websocket' && ctx.executeCode) {
				try {
					await Promise.resolve(ctx.execute.route.onMessage(ctr))
				} catch (err) {
					ctx.error = err
					ctx.execute.event = 'wsMessageError'
					await runPageLogic()
				}

				return resolve()
			}

			return resolve()
		}); await runPageLogic()

		// Execute Queue
		if (ctx.queue.length > 0) {
			const err = await ctx.runQueue()

			if (err) {
				ctx.error = err
				ctx.execute.event = 'wsMessageError'
			}
		}; await runPageLogic(true)


		// Handle Reponse
		if (ctx.continueSend) ws.cork(() => {
			try {
				if (ctx.response.content.byteLength > 0) ws.send(ctx.response.content)
			} catch { }
		})
  }) ()}
}