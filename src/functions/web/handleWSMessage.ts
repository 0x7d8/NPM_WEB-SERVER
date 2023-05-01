import { GlobalContext } from "../../types/context"
import { WebSocket } from "uWebSockets.js"
import { WebSocketContext } from "../../types/webSocket"
import handleEvent from "../handleEvent"
import { getPreviousHours } from "./handleHTTPRequest"

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
    // Create Context Response Object
		const ctr = new ctg.classContexts.wsMessage(ctg.controller, ctx, ws)
		ctr["@"] = custom

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
					await Promise.resolve(ctx.execute.route.onMessage!(ctr as any))
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