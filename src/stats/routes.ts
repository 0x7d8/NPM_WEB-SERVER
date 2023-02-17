import { GlobalContext, RequestContext } from "../interfaces/context"
import { Options } from "../classes/serverOptions"
import { pathParser } from "../classes/routeList"
import ctr from "../interfaces/ctr"

import * as fs from "fs/promises"
import * as os from "os"

const coreCount = os.cpus().length

export default async function statsRoute(ctr: ctr, ctg: GlobalContext, ctx: RequestContext, options: Options, routes: number) {
  const path = ctr.url.path.replace(pathParser(options.dashboard.path, false), '') || '/'
  switch (path) {
    case "/":
      const dashboard = (await fs.readFile(`${__dirname}/index.html`, 'utf8'))
        .replaceAll('/rjweb-dashboard', pathParser(options.dashboard.path))

      return ctr.print(dashboard)

    case "/stats":
      const date = new Date()
      const startTime = date.getTime()
      const startUsage = process.cpuUsage()

      const cpuUsage = await new Promise<number>((resolve) => setTimeout(() => {
        const currentUsage = process.cpuUsage(startUsage)
        const currentTime = new Date().getTime()
        const timeDelta = (currentTime - startTime) * 5 * coreCount
        resolve((currentUsage.system + currentUsage.user) / timeDelta)
      }, 500))

      return ctr.print({
        requests: [
          ctg.requests.total,
          {
            hour: ctx.previousHours[0],
            amount: ctg.requests[ctx.previousHours[0]]
          },
          {
            hour: ctx.previousHours[1],
            amount: ctg.requests[ctx.previousHours[1]]
          },
          {
            hour: ctx.previousHours[2],
            amount: ctg.requests[ctx.previousHours[2]]
          },
          {
            hour: ctx.previousHours[3],
            amount: ctg.requests[ctx.previousHours[3]]
          },
          {
            hour: ctx.previousHours[4],
            amount: ctg.requests[ctx.previousHours[4]]
          }
        ], data: {
          incoming: [
            ctg.data.incoming.total,
            {
              hour: ctx.previousHours[0],
              amount: ctg.data.incoming[ctx.previousHours[0]]
            },
            {
              hour: ctx.previousHours[1],
              amount: ctg.data.incoming[ctx.previousHours[1]]
            },
            {
              hour: ctx.previousHours[2],
              amount: ctg.data.incoming[ctx.previousHours[2]]
            },
            {
              hour: ctx.previousHours[3],
              amount: ctg.data.incoming[ctx.previousHours[3]]
            },
            {
              hour: ctx.previousHours[4],
              amount: ctg.data.incoming[ctx.previousHours[4]]
            }
          ], outgoing: [
            ctg.data.outgoing.total,
            {
              hour: ctx.previousHours[0],
              amount: ctg.data.outgoing[ctx.previousHours[0]]
            },
            {
              hour: ctx.previousHours[1],
              amount: ctg.data.outgoing[ctx.previousHours[1]]
            },
            {
              hour: ctx.previousHours[2],
              amount: ctg.data.outgoing[ctx.previousHours[2]]
            },
            {
              hour: ctx.previousHours[3],
              amount: ctg.data.outgoing[ctx.previousHours[3]]
            },
            {
              hour: ctx.previousHours[4],
              amount: ctg.data.outgoing[ctx.previousHours[4]]
            }
          ]
        }, cpu: {
          time: `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`,
          usage: cpuUsage.toFixed(2)
        }, memory: {
          time: `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`,
          usage: (process.memoryUsage().heapUsed / 1000 / 1000).toFixed(2)
        },
        
        routes: routes,
        cached: ctg.cache.files.objectCount() + ctg.cache.routes.objectCount() + ctg.cache.auths.objectCount()
      })
  }
}