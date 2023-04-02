import { HTTPRequestContext, WSRequestContext } from ".."
import { GlobalContext, InternalContext } from "../types/context"
import { Events } from "../types/event"

export default async function handleEvent(eventParam: Events, ctr: HTTPRequestContext | WSRequestContext, ctx: InternalContext, ctg: GlobalContext) {
	switch (eventParam) {
		case "runtimeError": {
			const event = ctg.routes.event.find((event) => event.name === 'runtimeError')

			if (!event) {
				// Default RuntimeError
				console.error(ctx.error)
				ctx.response.status = 500
				ctx.response.content = Buffer.from(`An Error occured\n${ctx.error!.stack}`)
				ctx.execute.event = 'none'
			} else {
				// Custom RuntimeError
				try {
					if (event.name !== 'runtimeError') return
					await Promise.resolve(event.code(ctr as any, ctx.error!))
					ctx.execute.event = 'none'
				} catch (err: any) {
					console.error(err)
					ctx.response.status = 500
					ctx.response.content = Buffer.from(`An Error occured in your Error Event (what the hell?)\n${err.stack}`)
					ctx.execute.event = 'none'
				}
			}

			break
		}

		case "wsConnectError":
		case "wsMessageError":
		case "wsCloseError": {
			const event = ctg.routes.event.find((event) => event.name === eventParam)

			if (!event) {
				// Default WsError
				console.error(ctx.error)
				ctx.response.content = Buffer.from(`An Error occured\n${ctx.error!.stack}`)
				ctx.execute.event = 'none'
			} else {
				// Custom WsError
				try {
					await Promise.resolve(event.code(ctr as any, ctx.error!))
					ctx.execute.event = 'none'
				} catch (err: any) {
					console.error(err)
					ctx.response.content = Buffer.from(`An Error occured in your WsError Event (what the hell?)\n${err.stack}`)
					ctx.execute.event = 'none'
				}
			}

			break
		}

		case "wsRequest": {
			const event = ctg.routes.event.find((event) => (event.name === 'wsRequest'))

			if (event) {
				// Custom HttpRequest
				try {
					if (event.name !== 'wsRequest') return
					await Promise.resolve(event.code(ctr as any))
					ctx.execute.event = 'none'
				} catch (err: any) {
					ctx.error = err
					await handleEvent('runtimeError', ctr, ctx, ctg)
					ctx.execute.event = 'none'
				}
			}

			break
		}

		case "httpRequest": {
			const event = ctg.routes.event.find((event) => (event.name === 'httpRequest'))

			if (event) {
				// Custom HttpRequest
				try {
					if (event.name !== 'httpRequest') return
					await Promise.resolve(event.code(ctr as any))
					ctx.execute.event = 'none'
				} catch (err: any) {
					ctx.error = err
					await handleEvent('runtimeError', ctr, ctx, ctg)
					ctx.execute.event = 'none'
				}
			}

			break
		}

		case "http404": {
			const event = ctg.routes.event.find((event) => (event.name === 'http404'))

			if (!event) {
				// Default Http404
				ctx.response.status = 404
				ctx.response.headers['content-type'] = Buffer.from('text/plain')
				ctx.response.content = Buffer.from(`Couldnt find [${ctr.url.method}] ${ctr.url.path}`)
			} else {
				// Custom Http404
				try {
					if (event.name !== 'http404') return
					await Promise.resolve(event.code(ctr as any))
					ctx.execute.event = 'none'
				} catch (err: any) {
					ctx.error = err
					await handleEvent('runtimeError', ctr, ctx, ctg)
					ctx.execute.event = 'none'
				}
			}

			break
		}
	}
}