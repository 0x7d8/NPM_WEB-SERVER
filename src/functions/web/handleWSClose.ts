import { GlobalContext } from "../../types/context"
import { WebSocket } from "@rjweb/uws"
import { WebSocketContext } from "../../types/webSocket"
import handleEvent from "../handleEvent"

export default function handleWSClose(ws: WebSocket<WebSocketContext>, message: ArrayBuffer, ctg: GlobalContext) {
	const { custom, ctx } = ws.getUserData()

	ctg.logger.debug('WebSocket connection closed')

	ctx.body.type = 'unknown'
	ctx.body.raw = Buffer.from(message)
	ctx.body.parsed = ''
	ctx.executeSelf = () => true
	ctx.executeCode = true

	ctx.events.send('requestAborted')

	ctg.data.incoming.increase()

	ctx.handleError = (err) => {
		if (!err) return

		ctx.error = err
		ctx.execute.event = 'wsCloseError'
	}

	for (const { ref, refListener } of ctx.refListeners) {
		ref['removeOnChange'](refListener)
	}

  setImmediate(async() => {
		// Create Context Response Object
		const ctr = new ctg.classContexts.wsClose(ctg.controller, ctx, ws)
		ctr["@"] = custom

		// Execute Middleware
		if (ctg.middlewares.length > 0 && !ctx.error) {
			for (let middlewareIndex = 0; middlewareIndex < ctg.middlewares.length; middlewareIndex++) {
				const middleware = ctg.middlewares[middlewareIndex]
				if (!middleware.data.wsCloseEvent) continue

				try {
					await Promise.resolve(middleware.data.wsCloseEvent(middleware.localContext, () => ctx.executeCode = false, ctr, ctx, ctg))
					if (ctx.error) throw ctx.error
				} catch (err) {
					ctx.handleError(err)
					break
				}
			}
		}

		// Execute Custom run function
		await handleEvent('wsClose', ctr, ctx, ctg)

		// Execute Page Logic
		const runPageLogic = (eventOnly?: boolean) => new Promise<void>(async(resolve) => {
			// Execute Event
			if (ctx.execute.event !== 'none') {
				await handleEvent(ctx.execute.event, ctr, ctx, ctg)
				return resolve()
			}; if (eventOnly) return resolve()
			if (!ctx.execute.route) return

			// Execute Normal Route
			if (ctx.executeCode && ctx.execute.route.type === 'websocket' && ctx.execute.route.onClose) {
				try {
					await Promise.resolve(ctx.execute.route.onClose(ctr))
				} catch (err) {
					ctx.error = err
					ctx.execute.event = 'wsCloseError'
					await runPageLogic()
				}

				return resolve()
			}

			return resolve()
		}); await runPageLogic()
  })
}