import { GlobalContext } from "../../types/context"
import { WebSocket } from "uWebSockets.js"
import { parse as parseQuery } from "querystring"
import ValueCollection from "../../classes/valueCollection"
import { WebSocketClose, WebSocketContext } from "../../types/webSocket"
import handleEvent from "../handleEvent"
import { getPreviousHours } from "./handleHTTPRequest"

export default function handleWSClose(ws: WebSocket<WebSocketContext>, message: ArrayBuffer, ctg: GlobalContext) {
	let custom = ws.getUserData().custom
  let ctx = ws.getUserData().ctx
	ctx.previousHours = getPreviousHours()
	ctx.body.raw = Buffer.from(message)
	ctx.events.emit('requestAborted')

	ctg.data.incoming.total += message.byteLength
	ctg.data.incoming[ctx.previousHours[4]] += message.byteLength

	ctx.handleError = (err) => {
		if (!err) return

		ctx.error = err
		ctx.execute.event = 'wsCloseError'
	}

  {(async() => {
    // Get Correct Host IP
		let hostIp: string
		if (ctg.options.proxy && ctx.headers['x-forwarded-for']) hostIp = ctx.headers['x-forwarded-for']
		else hostIp = ctx.remoteAddress.split(':')[0]

		// Turn Cookies into Object
		let cookies: Record<string, string> = {}
		if (ctx.headers['cookie']) ctx.headers['cookie'].split(';').forEach((cookie) => {
			const parts = cookie.split('=')
			cookies[parts.shift()!.trim()] = parts.join('=')
		})

		// Parse Socket Message
		if (ctg.options.body.parse) {
			try { ctx.body.parsed = JSON.parse(ctx.body.raw.toString()) }
			catch (err) { ctx.body.parsed = ctx.body.raw.toString() }
		} else ctx.body.parsed = ctx.body.raw.toString()

		// Create Context Response Object
		let ctr: WebSocketClose = {
			type: 'close',

			// Properties
			controller: ctg.controller,
			headers: new ValueCollection(ctx.headers, decodeURIComponent) as any,
			cookies: new ValueCollection(cookies, decodeURIComponent),
			params: new ValueCollection(ws.getUserData().params, decodeURIComponent),
			queries: new ValueCollection(parseQuery(ctx.url.query) as any, decodeURIComponent),

			// Variables
			client: {
				userAgent: ctx.headers['user-agent'],
				port: Number(ctx.remoteAddress.split(':')[1]),
				ip: hostIp
			}, message: ctx.body.parsed,
			rawMessage: ctx.body.raw.toString(),
			url: ctx.url,

			// Custom Variables
			'@': custom,

			// Functions
			setCustom(name, value) {
				ctr['@'][name] = value

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
			if (!ctx.execute.route) return

			// Execute Normal Route
			if ('onClose' in ctx.execute.route && ctx.execute.route.type === 'websocket' && ctx.executeCode) {
				try {
					await Promise.resolve(ctx.execute.route.onClose!(ctr))
				} catch (err: any) {
					ctx.error = err
					ctx.execute.event = 'wsCloseError'
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
				ctx.execute.event = 'wsCloseError'
			}
		}; await runPageLogic(true)
  }) ()}
}