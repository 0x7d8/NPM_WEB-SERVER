import { GlobalContext } from "../../types/context"
import { WebSocket } from "@rjweb/uws"
import { WebSocketContext } from "../../types/webSocket"
import handleEvent from "../handleEvent"

export default function handleWSConnect(ws: WebSocket<WebSocketContext>, message: ArrayBuffer, ctg: GlobalContext) {
	const { custom, ctx } = ws.getUserData()

	ctg.logger.debug('WebSocket message with bytelen', message.byteLength, 'recieved')

	ctx.response.content = [ Buffer.allocUnsafe(0) ]
	ctx.body.type = 'unknown'
	ctx.body.raw = Buffer.from(message)
	ctx.body.parsed = ''
	ctx.continueSend = true
	ctx.executeSelf = () => true
	ctx.executeCode = true

	ctg.data.incoming.increase(ctx.body.raw.byteLength)
	ctg.webSockets.messages.incoming.increase()

	ctx.handleError = (err) => {
		if (!err) return

		ctx.error = err
		ctx.execute.event = 'wsMessageError'
	}

  {(async() => {
    // Create Context Response Object
		const ctr = new ctg.classContexts.wsMessage(ctg.controller, ctx, ws)
		ctr["@"] = custom

		// Ratelimiting
		if (ctx.execute.route && 'ratelimit' in ctx.execute.route.data && ctx.execute.route.data.ratelimit.maxHits !== Infinity) {
			let data = ctg.rateLimits.get(`ws+${ctr.client.ip}-${ctx.execute.route.data.ratelimit.sortTo}`, {
				hits: 0,
				end: Date.now() + ctx.execute.route.data.ratelimit.timeWindow
			})
	
			if (data.hits + 1 > ctx.execute.route.data.ratelimit.maxHits && data.end > Date.now()) {
				if (data.hits === ctx.execute.route.data.ratelimit.maxHits) data.end += ctx.execute.route.data.ratelimit.penalty
	
				ctx.executeCode = false
				ctx.execute.event = 'wsMessageRatelimit'
			} else if (data.end < Date.now()) {
				ctg.rateLimits.delete(`ws+${ctr.client.ip}-${ctx.execute.route.data.ratelimit.sortTo}`)
	
				data = {
					hits: 0,
					end: Date.now() + ctx.execute.route.data.ratelimit.timeWindow
				}
			}
	
			ctg.rateLimits.set(`ws+${ctr.client.ip}-${ctx.execute.route.data.ratelimit.sortTo}`, {
				...data,
				hits: data.hits + 1
			})
		}

		// Execute Middleware
		if (ctx.executeCode && ctg.middlewares.length > 0 && !ctx.error) {
			for (let middlewareIndex = 0; middlewareIndex < ctg.middlewares.length; middlewareIndex++) {
				const middleware = ctg.middlewares[middlewareIndex]
				if (!middleware.data.wsMessageEvent) continue

				try {
					await Promise.resolve(middleware.data.wsMessageEvent(middleware.localContext, () => ctx.executeCode = false, ctr, ctx, ctg))
					if (ctx.error) throw ctx.error
				} catch (err) {
					ctx.handleError(err)
					break
				}
			}
		}

		// Execute Custom run function
		await handleEvent('wsMessage', ctr, ctx, ctg)

		// Execute Page Logic
		const runPageLogic = (eventOnly?: boolean) => new Promise<void>(async(resolve) => {
			// Execute Event
			if (ctx.execute.event !== 'none') {
				await handleEvent(ctx.execute.event, ctr, ctx, ctg)
				return resolve()
			}; if (eventOnly) return resolve()
			if (!ctx.execute.route) return

			// Execute Normal Route
			if (ctx.executeCode && ctx.execute.route.type === 'websocket' && ctx.execute.route.onMessage) {
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
		})

		await runPageLogic()
  }) ()}
}