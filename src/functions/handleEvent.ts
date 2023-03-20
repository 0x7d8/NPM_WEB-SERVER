import { GlobalContext, RequestContext } from "../interfaces/context"
import { Events } from "../interfaces/event"
import { HTTPRequestContext } from "../interfaces/external"

export default async function handleEvent(event: Events, ctr: HTTPRequestContext, ctx: RequestContext, ctg: GlobalContext, error?: Error) {
	switch (event) {
		case "runtimeError": {
			const event = ctg.routes.event.find((event) => event.name === 'runtimeError')

			if (!event) {
				// Default Error
				console.error(error)
				ctr.status(500)
				ctx.content = Buffer.from(`An Error occured\n${error.stack}`)
			} else {
				// Custom Error
				try {
					if (event.name !== 'runtimeError') return
					await Promise.resolve(event.code(ctr, error))
				} catch (err) {
					console.error(err)
					ctr.status(500)
					ctx.content = Buffer.from(`An Error occured in your Error Event (what the hell?)\n${err.stack}`)
				}
			}
		}

		case "httpRequest": {
			let errorStop = false
			const event = ctg.routes.event.find((event) => (event.name === 'httpRequest'))

			if (event) {
				// Custom Request
				try {
					if (event.name !== 'httpRequest') return
					await Promise.resolve(event.code(ctr))
				} catch (err) {
					errorStop = true

					console.error(err)
					ctr.status(500)
					ctx.content = Buffer.from(`An Error occured in your Request Event\n${err.stack}`)
				}
			}; return errorStop
		}

		case "http404": {
			let errorStop = false
			const event = ctg.routes.event.find((event) => (event.name === 'http404'))

			if (!event) {
				// Default NotFound
				ctr.status(404).setHeader('Content-Type', 'text/plain')
				ctx.content = Buffer.from(`Couldnt find [${ctr.url.method}] ${ctr.url.pathname}`)
			} else {
				// Custom NotFound
				try {
					if (event.name !== 'http404') return
					await Promise.resolve(event.code(ctr))
				} catch (err) {
					errorStop = true

					console.error(err)
					ctr.status(500)
					ctx.content = Buffer.from(`An Error occured in your Notfound Event\n${err.stack}`)
				}
			}; return errorStop
		}
	}
}