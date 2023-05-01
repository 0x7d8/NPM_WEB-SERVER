import { RequestContext } from ".."
import { GlobalContext, LocalContext } from "../types/context"
import { EventHandlerMap } from "../types/event"

export default async function handleEvent(event: keyof EventHandlerMap<any, any>, ctr: RequestContext, ctx: LocalContext, ctg: GlobalContext) {
	ctx.execute.event = 'none'

	switch (event) {
		case "httpError":
		case "wsConnectError":
		case "wsMessageError":
		case "wsCloseError": {
			ctx.executeCode = false

			try {
				if (!await ctg.controller.emitSafe(event, ctr as any, ctx.error)) {
					if (ctr.type === 'http' || ctr.type === 'upgrade' || ctr.type === 'close') {
						ctx.response.status = 500
						ctx.response.statusMessage = undefined
						ctx.response.content = Buffer.from(`An Error occured:\n${ctx.error}`)
						console.error(`An Error occured:\n`, ctx.error)
					} else {
						ctr.print(Buffer.from(`An Error occured:\n${ctx.error}`))
						console.error(`An Error occured:\n`, ctx.error)
					}
				}
			} catch (err) {
				if (ctr.type === 'http' || ctr.type === 'upgrade' || ctr.type === 'close') {
					ctx.response.status = 500
					ctx.response.statusMessage = undefined
					ctx.response.content = Buffer.from(`An Error occured in the ${event} event:\n${err}`)
					console.error(`An Error occured in the ${event} event:\n`, err)
				} else {
					ctr.print(Buffer.from(`An Error occured in the ${event} event:\n${err}`))
					console.error(`An Error occured in the ${event} event:\n`, err)
				}
			}

			break
		}

		case "route404": {
			try {
				ctx.response.status = 404
				ctx.response.statusMessage = undefined
				ctx.response.content = Buffer.from(`Cannot ${ctr.url.method} ${ctr.url.path}`)

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
		case "wSClose": {
			try {
				await ctg.controller.emitSafe(event, ctr as any, () => ctx.executeCode = false)
			} catch (err) {
				ctx.error = err
				await handleEvent(event + 'Error' as any, ctr, ctx, ctg)
			}

			break
		}
	}
}