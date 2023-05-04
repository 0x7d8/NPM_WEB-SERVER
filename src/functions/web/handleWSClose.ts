import { GlobalContext } from "../../types/context"
import { WebSocket } from "@rjweb/uws"
import { WebSocketContext } from "../../types/webSocket"
import handleEvent from "../handleEvent"
import { getPreviousHours } from "./handleHTTPRequest"

export default function handleWSClose(ws: WebSocket<WebSocketContext>, message: ArrayBuffer, ctg: GlobalContext) {
	const { custom, ctx } = ws.getUserData()

	ctx.previousHours = getPreviousHours()
	ctx.body.raw = Buffer.from(message)
	ctx.body.parsed = ''
	ctx.executeCode = true

	ctx.events.emit('requestAborted')

	ctg.data.incoming.total += ctx.body.raw.byteLength
	ctg.data.incoming[ctx.previousHours[4]] += ctx.body.raw.byteLength

	ctx.handleError = (err) => {
		if (!err) return

		ctx.error = err
		ctx.execute.event = 'wsCloseError'
	}

  {(async() => {
		// Create Context Response Object
		const ctr = new ctg.classContexts.wsClose(ctg.controller, ctx, ws)
		ctr["@"] = custom

		// Execute Middleware
		if (ctg.middlewares.length > 0 && !ctx.error) {
			for (let middlewareIndex = 0; middlewareIndex < ctg.middlewares.length; middlewareIndex++) {
				const middleware = ctg.middlewares[middlewareIndex]
				if (!('wsCloseEvent' in middleware.data)) continue

				try {
					await Promise.resolve(middleware.data.wsCloseEvent!(middleware.localContext, () => ctx.executeCode = false, ctr, ctx, ctg))
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
			if ('onClose' in ctx.execute.route && ctx.execute.route.type === 'websocket' && ctx.executeCode) {
				try {
					await Promise.resolve(ctx.execute.route.onClose!(ctr as any))
				} catch (err) {
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