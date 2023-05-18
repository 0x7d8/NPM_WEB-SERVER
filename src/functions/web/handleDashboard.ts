import { GlobalContext, LocalContext } from "../../types/context"
import parsePath from "../parsePath"
import { getFilesRecursively } from "rjutils-collection"
import { getPreviousHours } from "../../classes/dataStat"
import { RequestContext } from "../../types/external"
import WebSocket from "../../types/webSocket"
import HTTP from "../../types/http"
import { Readable } from "stream"
import { Version } from "../../index"

import fs from "fs/promises"
import os from "os"

export const dashboardIndexRoute = (ctg: GlobalContext, ctx: LocalContext): HTTP => ({
  type: 'http',
  method: 'GET',
  path: '/',
  pathArray: ['', ''],
  onRequest: async(ctr) => await statsRoute(ctr as any, ctg, ctx, 'http'),
  data: {
    validations: [],
    headers: {}
  }, context: {
    data: {},
    keep: true
  }
})

export const dashboardWsRoute = (ctg: GlobalContext, ctx: LocalContext): WebSocket => ({
  type: 'websocket',
  path: '/',
  pathArray: ['', ''],
  onConnect: async(ctr) => await statsRoute(ctr as any, ctg, ctx, 'socket'),
  data: {
    validations: []
  }, context: {
    data: {},
    keep: true
  }
})

const hashCode = (value: string) => {
  return value.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0)
    return a & a
  }, 0).toString(16).replace('-', 'M')
}

const runStats = async(ctg: GlobalContext) => {
  const date = new Date()
  const startTime = date.getTime()
  const startUsage = process.cpuUsage()
  const previousHours = getPreviousHours()

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

  return {
    requests: {
      total: ctg.requests.stats.total,
      perSecond: ctg.requests.stats.perSecond,
      hours: Array.from({ length: 5 }, (value, index) => ({
        hour: previousHours[index],
        amount: ctg.requests.stats[previousHours[index]]
      }))
    }, webSockets: {
      opened: {
        total: ctg.webSockets.opened.stats.total,
        perSecond: ctg.webSockets.opened.stats.perSecond,
        hours: Array.from({ length: 5 }, (value, index) => ({
          hour: previousHours[index],
          amount: ctg.webSockets.opened.stats[previousHours[index]]
        }))
      }, messages: {
        incoming: {
          total: ctg.webSockets.messages.incoming.stats.total,
          perSecond: ctg.webSockets.messages.incoming.stats.perSecond,
          hours: Array.from({ length: 5 }, (value, index) => ({
            hour: previousHours[index],
            amount: ctg.webSockets.messages.incoming.stats[previousHours[index]]
          }))
        }, outgoing: {
          total: ctg.webSockets.messages.outgoing.stats.total,
          perSecond: ctg.webSockets.messages.outgoing.stats.perSecond,
          hours: Array.from({ length: 5 }, (value, index) => ({
            hour: previousHours[index],
            amount: ctg.webSockets.messages.outgoing.stats[previousHours[index]]
          }))
        }
      }
    }, data: {
      incoming: {
        total: ctg.data.incoming.stats.total,
        perSecond: ctg.data.incoming.stats.perSecond,
        hours: Array.from({ length: 5 }, (value, index) => ({
          hour: previousHours[index],
          amount: ctg.data.incoming.stats[previousHours[index]]
        }))
      }, outgoing: {
        total: ctg.data.outgoing.stats.total,
        perSecond: ctg.data.outgoing.stats.perSecond,
        hours: Array.from({ length: 5 }, (value, index) => ({
          hour: previousHours[index],
          amount: ctg.data.outgoing.stats[previousHours[index]]
        }))
      }
    }, cpu: {
      time: `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`,
      usage: cpuUsage.toFixed(2)
    }, memory: {
      time: `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`,
      usage: process.memoryUsage().heapUsed + process.memoryUsage().external
    },

    routes: {
      user: ctg.routes.normal.length + ctg.routes.websocket.length,
      automatic: ctg.routes.htmlBuilder.length
    }, staticFiles,
    middlewares: ctg.middlewares.length,
    cached: ctg.cache.files.objectCount
      + ctg.cache.middlewares.objectCount
      + ctg.cache.routes.objectCount
  }
}

export type DashboardStats = Awaited<ReturnType<typeof runStats>>

const coreCount = os.cpus().length

export default async function statsRoute(ctr: RequestContext, ctg: GlobalContext, ctx: LocalContext, type: 'http' | 'socket') {
  switch (type) {
    case "http": {
      if (ctr.type !== 'http') return

      const dashboard = (await fs.readFile(`${__dirname}/dashboard.html`, 'utf8'))
        .replaceAll('/rjweb-dashboard', parsePath(ctg.options.dashboard.path))
        .replace('1.1.1', Version)

      return ctr.print(dashboard)
    }

    case "socket": {
      if (ctr.type !== 'connect') return

      if (ctg.options.dashboard.password && ctr.queries.get('password') !== hashCode(ctg.options.dashboard.password)) return ctr.close(1, {
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

        interval = setInterval(() => readable.push(runStats(ctg)), ctg.options.dashboard.updateInterval)
        process.nextTick(() => readable.push(runStats(ctg)))

        return readable
      }) ())
    }
  }
}