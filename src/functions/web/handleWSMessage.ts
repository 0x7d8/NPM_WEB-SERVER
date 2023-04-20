import { GlobalContext } from "../../types/context"
import { WebSocket } from "uWebSockets.js"
import { parse as parseQuery } from "querystring"
import parseContent, { ParseContentReturns } from "../parseContent"
import ValueCollection from "../../classes/valueCollection"
import { WebSocketContext, WebSocketMessage } from "../../types/webSocket"
import handleEvent from "../handleEvent"
import { getPreviousHours } from "./handleRequest"

export default function handleWSConnect(ws: WebSocket<WebSocketContext>, message: ArrayBuffer, ctg: GlobalContext) {
	const { custom, ctx } = ws.getUserData()

	ctx.response.content = Buffer.allocUnsafe(0)
	ctx.previousHours = getPreviousHours()
	ctx.body.raw = Buffer.from(message)
	ctx.body.parsed = ''
	ctx.continueSend = true
	ctx.executeCode = true
	ctx.queue = []

	ctg.data.incoming.total += ctx.body.raw.byteLength
	ctg.data.incoming[ctx.previousHours[4]] += ctx.body.raw.byteLength

	ctg.webSockets.messages.incoming.total++
	ctg.webSockets.messages.incoming[ctx.previousHours[4]]++

	ctx.handleError = (err) => {
		if (!err) return

		ctx.error = err
		ctx.execute.event = 'wsMessageError'
	}

  {(async() => {
    // Get Correct Host IP
		let hostIp: string
		if (ctg.options.proxy && ctx.headers['x-forwarded-for']) hostIp = ctx.headers['x-forwarded-for']
		else hostIp = ctx.remoteAddress.split(':')[0]

		// Create Context Response Object
		const ctr: WebSocketMessage = {
			type: 'message',

			// Properties
			controller: ctg.controller,
			headers: new ValueCollection(ctx.headers, decodeURIComponent) as any,
			cookies: new ValueCollection(ctx.cookies, decodeURIComponent),
			params: new ValueCollection(ws.getUserData().params, decodeURIComponent),
			queries: new ValueCollection(parseQuery(ctx.url.query) as any),
			hashes: new ValueCollection(parseQuery(ctx.url.hash) as any),

			// Variables
			client: {
				userAgent: ctx.headers['user-agent'] ?? null,
				port: Number(ctx.remoteAddress.split(':')[1]),
				ip: hostIp
			}, get message() {
				if (!ctx.body.parsed) {
					const stringified = ctx.body.raw.toString()
					if (ctg.options.body.parse) {
						try { ctx.body.parsed = JSON.parse(stringified) }
						catch { ctx.body.parsed = stringified }
					} else ctx.body.parsed = stringified
				}

				return ctx.body.parsed
			}, get rawMessage() {
				return ctx.body.raw.toString()
			},

			url: ctx.url,
			domain: ctx.headers['host'],

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

					try {
						ws.end(0, result.content)
					} catch { }

					ctx.queue = []
				}))

				return ctr
			}, print(content, options = {}) {
				const prettify = options?.prettify ?? false

				ctx.scheduleQueue('execution', (async() => {
					let result: ParseContentReturns
					try {
						result = await parseContent(content, prettify)
					} catch (err) {
						return ctx.handleError(err)
					}

					try {
						ws.send(result.content)
						ctg.webSockets.messages.outgoing.total++
						ctg.webSockets.messages.outgoing[ctx.previousHours[4]]++
					} catch { }
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
									ctg.webSockets.messages.outgoing.total++
									ctg.webSockets.messages.outgoing[ctx.previousHours[4]]++

									ws.send(data)
								} catch {
									ctx.events.emit('requestAborted')
								}

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

		// Execute Middleware
		if (ctg.middlewares.length > 0 && !ctx.error) {
			for (let middlewareIndex = 0; middlewareIndex < ctg.middlewares.length; middlewareIndex++) {
				const middleware = ctg.middlewares[middlewareIndex]
				if (!('wsMessageEvent' in middleware.data)) continue

				try {
					await Promise.resolve(middleware.data.wsMessageEvent!(middleware.localContext, () => ctx.executeCode = false, ctr, ctx, ctg))
					if (ctx.error) throw ctx.error
				} catch (err) {
					ctx.handleError(err)
					break
				}
			}
		}

		// Execute Page Logic
		const runPageLogic = (eventOnly?: boolean) => new Promise<void>(async(resolve) => {
			// Execute Event
			if (ctx.execute.event !== 'none') {
				await handleEvent(ctx.execute.event, ctr, ctx, ctg)
				return resolve()
			}; if (eventOnly) return resolve()
			if (!ctx.execute.route) return

			// Execute Normal Route
			if ('onMessage' in ctx.execute.route && ctx.execute.route.type === 'websocket' && ctx.executeCode) {
				try {
					await Promise.resolve(ctx.execute.route.onMessage!(ctr))
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
		try {
			if (ctx.response.content.byteLength > 0 && ctx.continueSend) return ws.cork(() => {
				try {
					ctg.webSockets.messages.outgoing.total++
					ctg.webSockets.messages.outgoing[ctx.previousHours[4]]++

					ws.send(ctx.response.content)
				} catch { }
			})
		} catch { }
  }) ()}
}