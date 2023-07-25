import { RequestContext, Status } from ".."
import { GlobalContext, LocalContext } from "../types/context"
import { EventHandlerMap } from "../types/event"

export default async function handleEvent(event: keyof EventHandlerMap<any, any>, ctr: RequestContext, ctx: LocalContext, ctg: GlobalContext) {
	if (event === ctx.execute.event) ctx.execute.event = 'none'

	switch (event) {
		case "httpError":
		case "wsConnectError":
		case "wsMessageError":
		case "wsCloseError": {
			ctx.executeCode = false

			try {
				if (!await ctg.controller.emitSafe(event, ctr as any, ctx.error)) {
					if (ctr.type === 'http' || ctr.type === 'upgrade' || ctr.type === 'close') {
						ctx.response.status = Status.INTERNAL_SERVER_ERROR
						ctx.response.statusMessage = undefined
						ctx.response.content = [ `An Error occured:\n${ctx.error}` ]
						ctg.logger.error(`An Error while handling request occured:\n`, ctx.error)
					} else {
						ctr.print(`An Error occured:\n${ctx.error}`)
						ctg.logger.error(`An Error while handling request occured:\n`, ctx.error)
					}
				}
			} catch (err) {
				if (ctr.type === 'http' || ctr.type === 'upgrade' || ctr.type === 'close') {
					ctx.response.status = Status.INTERNAL_SERVER_ERROR
					ctx.response.statusMessage = undefined
					ctx.response.content = [ `An Error occured in the ${event} event:\n${err}` ]
					ctg.logger.error(`An Error occured in the ${event} event:\n`, err)
				} else {
					ctr.print(`An Error occured in the ${event} event:\n${err}`)
					ctg.logger.error(`An Error occured in the ${event} event:\n`, err)
				}
			}

			break
		}

		case "httpRatelimit":
		case "wsMessageRatelimit": {
			ctx.executeCode = false

			try {
				if (!await ctg.controller.emitSafe(event, ctr as any)) {
					if (ctr.type === 'http' || ctr.type === 'upgrade' || ctr.type === 'close') {
						ctx.response.status = Status.TOO_MANY_REQUESTS
						ctx.response.statusMessage = undefined
						ctx.response.content = [ 'You are sending too many requests! Check headers for more information.' ]
					} else {
						ctr.print('You are sending too many requests!')
					}
				}
			} catch (err) {
				if (ctr.type === 'http' || ctr.type === 'upgrade' || ctr.type === 'close') {
					ctx.response.status = Status.INTERNAL_SERVER_ERROR
					ctx.response.statusMessage = undefined
					ctx.response.content = [ `An Error occured in the ${event} event:\n${err}` ]
					ctg.logger.error(`An Error occured in the ${event} event:\n`, err)
				} else {
					ctr.print(`An Error occured in the ${event} event:\n${err}`)
					ctg.logger.error(`An Error occured in the ${event} event:\n`, err)
				}
			}

			break
		}

		case "route404": {
			try {
				ctx.response.status = Status.NOT_FOUND
				ctx.response.statusMessage = undefined
				ctx.response.content = [ `Cannot ${ctr.url.method} ${ctr.url.path}` ]

				await ctg.controller.emitSafe(event, ctr as any)
			} catch (err) {
				ctx.error = err
				await handleEvent('httpError', ctr, ctx, ctg)
			}

			break
		}

		case "httpRequest": {
			try {
				await ctg.controller.emitSafe(event, ctr as any, () => ctx.executeCode = false)
			} catch (err) {
				ctx.error = err
				await handleEvent('httpError', ctr, ctx, ctg)
			}

			break
		}

		case "wsConnect":
		case "wsMessage":
		case "wsClose": {
			try {
				await ctg.controller.emitSafe(event, ctr as any, () => ctx.executeCode = false)
			} catch (err) {
				ctx.error = err
				await handleEvent(event.concat('Error') as keyof EventHandlerMap<any, any>, ctr, ctx, ctg)
			}

			break
		}
	}
}