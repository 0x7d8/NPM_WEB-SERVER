import { GlobalContext, RequestContext } from "../interfaces/context"
import { Events } from "../interfaces/event"
import Ctr from "../interfaces/ctr"

export default async function handleEvent(event: Events, ctr: Ctr, ctx: RequestContext, ctg: GlobalContext) {
  switch (event) {
    case "error": {
      const event = ctg.routes.event.find((event) => (event.event === 'error'))

      if (!event) {
        // Default Error
        console.log(ctr.error)
        ctr.status(500)
        ctx.content = Buffer.from(`An Error occured\n${(ctr.error as Error).stack}`)
      } else {
        // Custom Error
        Promise.resolve(event.code(ctr as any as Ctr<any, true>)).catch((e) => {
          console.log(e)
          ctr.status(500)
          ctx.content = Buffer.from(`An Error occured in your Error Event (what the hell?)\n${e.stack}`)
        })
      }
    }

    case "request": {
      let errorStop = false
      const event = ctg.routes.event.find((event) => (event.event === 'request'))

      if (event) {
        // Custom Request
        await Promise.resolve(event.code(ctr)).catch((e) => {
          errorStop = true

          console.log(e)
          ctr.status(500)
          ctx.content = Buffer.from(`An Error occured in your Request Event\n${e.stack}`)
        })
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
        await Promise.resolve(event.code(ctr)).catch((e) => {
          errorStop = true

          console.log(e)
          ctr.status(500)
          ctx.content = Buffer.from(`An Error occured in your Notfound Event\n${e.stack}`)
        })
      }; return errorStop
    }
  }
}