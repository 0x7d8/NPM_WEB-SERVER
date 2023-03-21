import { GlobalContext, InternalContext } from "../interfaces/context"
import { Events } from "../interfaces/event"
import { HTTPRequestContext } from "../interfaces/external"

export default async function handleEvent(event: Events, ctr: HTTPRequestContext, ctx: InternalContext, ctg: GlobalContext) {
	switch (event) {
		case "runtimeError": {
			const event = ctg.routes.event.find((event) => event.name === 'runtimeError')

			if (!event) {
				// Default RuntimeError
				console.error(ctx.error)
				ctx.response.status = 500
				ctx.response.content = Buffer.from(`An Error occured\n${ctx.error.stack}`)
				ctx.execute.event = 'none'
			} else {
				// Custom RuntimeError
				try {
					if (event.name !== 'runtimeError') return
					await Promise.resolve(event.code(ctr, ctx.error))
					ctx.execute.event = 'none'
				} catch (err) {
					console.error(err)
					ctx.response.status = 500
					ctx.response.content = Buffer.from(`An Error occured in your Error Event (what the hell?)\n${err.stack}`)
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
					await Promise.resolve(event.code(ctr))
					ctx.execute.event = 'none'
				} catch (err) {
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
				ctx.response.headers['content-type'] = 'text/plain'
				ctx.response.content = Buffer.from(`Couldnt find [${ctr.url.method}] ${ctr.url.pathname}`)
			} else {
				// Custom Http404
				try {
					if (event.name !== 'http404') return
					await Promise.resolve(event.code(ctr))
					ctx.execute.event = 'none'
				} catch (err) {
					ctx.error = err
					await handleEvent('runtimeError', ctr, ctx, ctg)
					ctx.execute.event = 'none'
				}
			}

			break
		}
	}
}