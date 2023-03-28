import { GlobalContext, InternalContext } from "../types/context"
import { pathParser } from "../classes/URLObject"
import { getAllFiles } from "../misc/getAllFiles"
import { HTTPRequestContext } from "../types/external"
import { WebSocketConnect } from "../types/webSocket"
import { Readable } from "stream"
import { Version } from "../index"

import fs from "fs/promises"
import os from "os"

const coreCount = os.cpus().length

export default async function statsRoute(ctr: HTTPRequestContext | WebSocketConnect, ctg: GlobalContext, ctx: InternalContext, type: 'http' | 'socket') {
  switch (type) {
    case "http": {
      const dashboard = (await fs.readFile(`${__dirname}/index.html`, 'utf8'))
        .replaceAll('/rjweb-dashboard', pathParser(ctg.options.dashboard.path))
        .replace('1.1.1', Version)

      return ctr.print(dashboard)
    }

    case "socket": {
      let interval: NodeJS.Timer
      ctr.printStream((() => {
        const readable = new Readable({
          objectMode: true,
          read() {},
          destroy() {
            clearInterval(interval)
          }
        })

        interval = setInterval(async() => {
          const date = new Date()
          const startTime = date.getTime()
          const startUsage = process.cpuUsage()
  
          const staticFiles = await new Promise<number>(async(resolve) => {
            let staticFiles = 0
            for (let staticNumber = 0; staticNumber <= ctg.routes.static.length - 1; staticNumber++) {
              staticFiles += (await getAllFiles(ctg.routes.static[staticNumber].location)).length
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
            routes: ctg.routes.normal.length + ctg.routes.websocket.length,
            cached: ctg.cache.files.objectCount
              + ctg.cache.routes.objectCount
          })
        }, 1500)

        return readable
      }) ())
    }
  }
}