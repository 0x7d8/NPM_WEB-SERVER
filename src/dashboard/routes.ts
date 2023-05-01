import { GlobalContext, LocalContext } from "../types/context"
import parsePath from "../functions/parsePath"
import { getFilesRecursively } from "rjutils-collection"
import { RequestContext } from "../types/external"
import { Readable } from "stream"
import { Version } from "../index"

import fs from "fs/promises"
import os from "os"

const coreCount = os.cpus().length

export default async function statsRoute(ctr: RequestContext, ctg: GlobalContext, ctx: LocalContext, type: 'http' | 'socket') {
  switch (type) {
    case "http": {
      if (ctr.type !== 'http') return

      const dashboard = (await fs.readFile(`${__dirname}/index.html`, 'utf8'))
        .replaceAll('/rjweb-dashboard', parsePath(ctg.options.dashboard.path))
        .replace('/* PWD */ true', String(!!ctg.options.dashboard.password))
        .replace('1.1.1', Version)

      return ctr.print(dashboard)
    }

    case "socket": {
      if (ctr.type !== 'connect') return

      if (ctg.options.dashboard.password && ctr.queries.get('password') !== ctg.options.dashboard.password) return ctr.close(1, {
        error: 'password'
      })

      let interval: NodeJS.Timer | null = null
      ctr.printStream((() => {
        const readable = new Readable({
          objectMode: true,
          read() {},
          destroy() {
            clearInterval(interval!)
          }
        })

        const runStats = async() => {
          const date = new Date()
          const startTime = date.getTime()
          const startUsage = process.cpuUsage()
  
          const staticFiles = await new Promise<number>(async(resolve) => {
            let staticFiles = 0
            for (let staticNumber = 0; staticNumber < ctg.routes.static.length; staticNumber++) {
              staticFiles += (await getFilesRecursively(ctg.routes.static[staticNumber].location, true)).length
            }
  
            resolve(staticFiles)
          })
  
          const cpuUsage = await new Promise<number>((resolve) => setTimeout(() => {
            const currentUsage = process.cpuUsage(startUsage)
            const currentTime = new Date().getTime()
            const timeDelta = (currentTime - startTime) * 5 * coreCount
            resolve((currentUsage.system + currentUsage.user) / timeDelta)
          }, 500))
  
          readable.push({
            requests: Array.from({ length: 6 }, (value, index) => {
              if (index === 0) return ctg.requests.total
              else return {
                hour: ctx.previousHours[index - 1],
                amount: ctg.requests[ctx.previousHours[index - 1]]
              }
            }), web_sockets: {
              opened: Array.from({ length: 6 }, (value, index) => {
                if (index === 0) return ctg.webSockets.opened.total
                else return {
                  hour: ctx.previousHours[index - 1],
                  amount: ctg.webSockets.opened[ctx.previousHours[index - 1]]
                }
              }), messages: {
                incoming: Array.from({ length: 6 }, (value, index) => {
                  if (index === 0) return ctg.webSockets.messages.incoming.total
                  else return {
                    hour: ctx.previousHours[index - 1],
                    amount: ctg.webSockets.messages.incoming[ctx.previousHours[index - 1]]
                  }
                }), outgoing: Array.from({ length: 6 }, (value, index) => {
                  if (index === 0) return ctg.webSockets.messages.outgoing.total
                  else return {
                    hour: ctx.previousHours[index - 1],
                    amount: ctg.webSockets.messages.outgoing[ctx.previousHours[index - 1]]
                  }
                })
              }
            }, data: {
              incoming: Array.from({ length: 6 }, (value, index) => {
                if (index === 0) return ctg.data.incoming.total
                else return {
                  hour: ctx.previousHours[index - 1],
                  amount: ctg.data.incoming[ctx.previousHours[index - 1]]
                }
              }), outgoing: Array.from({ length: 6 }, (value, index) => {
                if (index === 0) return ctg.data.outgoing.total
                else return {
                  hour: ctx.previousHours[index - 1],
                  amount: ctg.data.outgoing[ctx.previousHours[index - 1]]
                }
              })
            }, cpu: {
              time: `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`,
              usage: cpuUsage.toFixed(2)
            }, memory: {
              time: `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`,
              usage: (process.memoryUsage().heapUsed / 1000 / 1000).toFixed(2)
            },
  
            static_files: staticFiles,
            user_routes: ctg.routes.normal.length + ctg.routes.websocket.length,
            automatic_routes: ctg.routes.htmlBuilder.length,
            cached: ctg.cache.files.objectCount
              + ctg.cache.middlewares.objectCount
              + ctg.cache.routes.objectCount
          })
        }

        interval = setInterval(runStats, ctg.options.dashboard.updateInterval)
        runStats()

        return readable
      }) ())
    }
  }
}