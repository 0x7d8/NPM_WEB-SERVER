import { GlobalContext, RequestContext } from "../interfaces/context"
import { Events } from "../interfaces/internal"
import { HTTPRequestContext } from "../interfaces/external"

export default async function handleEvent(event: Events, ctr: HTTPRequestContext, ctx: RequestContext, ctg: GlobalContext) {
  switch (event) {
    case "error": {
      const event = ctg.routes.event.find((event) => (event.event === 'error'))

      if (!event) {
        // Default Error
        console.error(ctr.error)
        ctr.status(500)
        ctx.content = Buffer.from(`An Error occured\n${(ctr.error as Error).stack}`)
      } else {
        // Custom Error
        try {
          await Promise.resolve(event.code(ctr))
        } catch (err) {
          console.error(err)
          ctr.status(500)
          ctx.content = Buffer.from(`An Error occured in your Error Event (what the hell?)\n${err.stack}`)
        }
      }
    }

    case "request": {
      let errorStop = false
      const event = ctg.routes.event.find((event) => (event.event === 'request'))

      if (event) {
        // Custom Request
        try {
          await Promise.resolve(event.code(ctr))
        } catch (err) {
          errorStop = true

          console.error(err)
          ctr.status(500)
          ctx.content = Buffer.from(`An Error occured in your Request Event\n${err.stack}`)
        }
      }; return errorStop
    }

    case "notfound": {
      let errorStop = false
      const event = ctg.routes.event.find((event) => (event.event === 'notfound'))

      if (!event) {
        // Default NotFound
        ctr.status(404).setHeader('Content-Type', 'text/plain')
        ctx.content = Buffer.from(`Couldnt find [${ctr.url.method}] ${ctr.url.pathname}`)
      } else {
        // Custom NotFound
        try {
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