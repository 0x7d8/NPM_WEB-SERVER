import { GlobalContext } from "../../types/context"
import { WebSocket } from "@rjweb/uws"
import { WebSocketContext } from "../../types/webSocket"
import handleEvent from "../handleEvent"

export default function handleWSOpen(ws: WebSocket<WebSocketContext>, ctg: GlobalContext) {
	const { custom, ctx } = ws.getUserData()

	ctg.logger.debug('WebSocket connection established')

	ctx.response.content = Buffer.allocUnsafe(0)
	ctx.continueSend = true
	ctx.executeSelf = () => true
	ctx.executeCode = true

	ctx.handleError = (err) => {
		if (!err) return

		ctx.error = err
		ctx.execute.event = 'wsConnectError'
	}

  {(async() => {
    // Create Context Response Object
		const ctr = new ctg.classContexts.wsConnect(ctg.controller, ctx, ws)
		ctr["@"] = custom

		// Execute Custom Run Function
		if (ctx.executeCode) await handleEvent('wsConnect', ctr, ctx, ctg)

		// Execute Middleware
		if (ctg.middlewares.length > 0 && !ctx.error) {
			for (let middlewareIndex = 0; middlewareIndex < ctg.middlewares.length; middlewareIndex++) {
				const middleware = ctg.middlewares[middlewareIndex]
				if (!('wsConnectEvent' in middleware.data)) continue

				try {
					await Promise.resolve(middleware.data.wsConnectEvent!(middleware.localContext, () => ctx.executeCode = false, ctr, ctx, ctg))
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
			if ('onConnect' in ctx.execute.route && ctx.execute.route.type === 'websocket' && ctx.executeCode) {
				try {
					await Promise.resolve(ctx.execute.route.onConnect!(ctr as any))
				} catch (err) {
					ctx.error = err
					ctx.execute.event = 'wsConnectError'
					await runPageLogic()
				}

				return resolve()
			}

			return resolve()
		}); await runPageLogic()

		// Execute Self Sufficient Script
		try {
			const result = await Promise.resolve(ctx.executeSelf())
			ctx.continueSend = result

			if (result) await runPageLogic(true)
		} catch (err) {
			ctx.handleError(err)
			await runPageLogic(true)
		}
  }) ()}
}