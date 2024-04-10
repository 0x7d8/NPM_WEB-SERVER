import { Middleware } from "rjweb-server"

const ipHits: Record<string, number> = {}

export const middleware = new Middleware<{
  query: string
}, {
  ipHits: number
}>('devil middleware', '1.0.0')
  .load((config) => {
    console.log('middleware initted!', config)
  })
  .httpRequest((config, server, context, ctr, end) => {
    if (ctr.queries.has(config.query)) {
      const hits = ipHits[ctr.client.ip.usual()] ?? 0
      ipHits[ctr.client.ip.usual()] = hits + 1

      return end(ctr.status(666, 'Devil').print(`You wanted to end the request... for the devil! (request ${hits + 1})`))
    }

    context.data(middleware).ipHits = ipHits[ctr.client.ip.usual()] ?? 0
  })
  .httpRequestFinish((config, server, context, ctr, ms) => {
    console.log(`Request took ${ms}ms, someone that has ${context.data(middleware).ipHits} hits, escaped the devil!`)
  })
  .export()