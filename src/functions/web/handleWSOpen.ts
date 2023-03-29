import { GlobalContext } from "../../types/context"
import { WebSocket } from "uWebSockets.js"
import { parse as parseQuery } from "querystring"
import parseContent, { Returns as ParseContentReturns } from "../parseContent"
import ValueCollection from "../../classes/valueCollection"
import { WebSocketConnect, WebSocketContext } from "../../types/webSocket"
import { getPreviousHours } from "./handleRequest"
import handleEvent from "../handleEvent"

export default function handleWSOpen(ws: WebSocket<WebSocketContext>, ctg: GlobalContext) {
	let custom = ws.getUserData().custom
  let ctx = ws.getUserData().ctx
	ctx.response.content = Buffer.alloc(0)
	ctx.previousHours = getPreviousHours()
	ctx.continueSend = true
	ctx.executeCode = true
	ctx.queue = []

	ctx.handleError = (err) => {
		if (!err) return

		ctx.error = err
		ctx.execute.event = 'wsConnectError'
	}

  {(async() => {
    // Get Correct Host IP
		let hostIp: string
		if (ctg.options.proxy && ctx.headers['x-forwarded-for']) hostIp = ctx.headers['x-forwarded-for']
		else hostIp = ctx.remoteAddress.split(':')[0]

		// Create Context Response Object
		let ctr: WebSocketConnect = {
			type: 'connect',

			// Properties
			controller: ctg.controller,
			headers: new ValueCollection(ctx.headers, decodeURIComponent) as any,
			cookies: new ValueCollection(ctx.cookies, decodeURIComponent),
			params: new ValueCollection(ws.getUserData().params, decodeURIComponent),
			queries: new ValueCollection(parseQuery(ctx.url.query as any) as any),
			hashes: new ValueCollection(parseQuery(ctx.url.hash as any) as any),

			// Variables
			client: {
				userAgent: ctx.headers['user-agent'],
				port: Number(ctx.remoteAddress.split(':')[1]),
				ip: hostIp
			}, url: ctx.url,

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
					} catch (err: any) {
						return ctx.handleError(err)
					}

					try {
						ws.end(0, result.content)
					} catch { }

					ctx.queue = []
				}))

				return ctr
			}, print(content) {
				ctx.scheduleQueue('execution', (async() => {
					let result: ParseContentReturns
					try {
						result = await parseContent(content)
					} catch (err: any) {
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
								} catch (err: any) {
									return ctx.handleError(err)
								}

								try {
									ctg.webSockets.messages.outgoing.total++
									ctg.webSockets.messages.outgoing[ctx.previousHours[4]]++

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

		// Execute Middleware
		if (ctg.middlewares.length > 0 && !ctx.error) {
			for (let middlewareIndex = 0; middlewareIndex < ctg.middlewares.length; middlewareIndex++) {
				const middleware = ctg.middlewares[middlewareIndex]
				if (!('wsConnectEvent' in middleware.data)) continue

				try {
					await Promise.resolve(middleware.data.wsConnectEvent!(middleware.localContext, () => ctx.executeCode = false, ctr, ctx, ctg))
					if (ctx.error) throw ctx.error
				} catch (err: any) {
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
			if ('onConnect' in ctx.execute.route && ctx.execute.route.type === 'websocket' && ctx.executeCode) {
				try {
					await Promise.resolve(ctx.execute.route.onConnect!(ctr))
				} catch (err: any) {
					ctx.error = err
					ctx.execute.event = 'wsConnectError'
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
				ctx.execute.event = 'wsConnectError'
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