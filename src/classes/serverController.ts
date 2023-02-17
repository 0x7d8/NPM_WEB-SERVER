import * as ServerEvents from "../interfaces/serverEvents"
import { GlobalContext } from "../interfaces/context"
import ServerOptions, { Options } from "./serverOptions"
import routeList from "./routeList"

import * as https from "https"
import * as http from "http"

export default class ServerController {
  private globalContext: GlobalContext
  private optionsCache: Record<string, any>
  private options: Options
  public server: http.Server | https.Server

  /** Server Controller */
  constructor(
    /** The Global Context */ globalContext: GlobalContext,
    /** The HTTP / HTTPS Server */ server: http.Server | https.Server,
    /** The Server Options */ options: Options
  ) {
    this.globalContext = globalContext
    this.optionsCache = {}
    this.server = server
    this.options = options

    this.globalContext.controller = this
  }

  /** Set new Routes for the Server */
  setRoutes(
    /** The RouteList Class */ list: routeList
  ) {
    const { routes, events, authChecks: auths } = list.list()
    this.optionsCache.normal = routes
    this.optionsCache.event = events
    this.optionsCache.auth = auths

    return this
  }

  /** Set new Options for the Server */
  setOptions(
    /** The Options */ options: Partial<Options>
  ) {
    this.options = new ServerOptions(options).getOptions()

    return this
  }

  /** Start the Server */
  start() {
    this.globalContext.routes.normal = this.optionsCache.normal
    this.globalContext.routes.event = this.optionsCache.event
    this.globalContext.routes.auth = this.optionsCache.auth
    this.server.listen(this.options.port, this.options.bind)
		return new Promise((resolve: (value: ServerEvents.StartSuccess) => void, reject: (reason: ServerEvents.StartError) => void) => {
			this.server.once('listening', () => resolve({ success: true, port: this.options.port, message: 'WEBSERVER STARTED' }))
			this.server.once('error', (error: Error) => { this.server.close(); reject({ success: false, error, message: 'WEBSERVER ERRORED' }) })
		})
  }

  /** Load all Server Routes & Options */
  async reload(
    /** Whether to restart the HTTP Server itself */ restartHTTP?: boolean
  ) {
    this.globalContext.pageDisplay = ''
    this.globalContext.cache.files.clear()
    this.globalContext.cache.routes.clear()
    this.globalContext.cache.auths.clear()
    this.globalContext.routes.normal = this.optionsCache.normal
    this.globalContext.routes.event = this.optionsCache.event
    this.globalContext.routes.auth = this.optionsCache.auth
    this.globalContext.data = {
      incoming: {
        total: 0,
        0: 0, 1: 0, 2: 0, 3: 0,
        4: 0, 5: 0, 6: 0, 7: 0,
        8: 0, 9: 0, 10: 0, 11: 0,
        12: 0, 13: 0, 14: 0, 15: 0,
        16: 0, 17: 0, 18: 0, 19: 0,
        20: 0, 21: 0, 22: 0, 23: 0
      }, outgoing: {
        total: 0,
        0: 0, 1: 0, 2: 0, 3: 0,
        4: 0, 5: 0, 6: 0, 7: 0,
        8: 0, 9: 0, 10: 0, 11: 0,
        12: 0, 13: 0, 14: 0, 15: 0,
        16: 0, 17: 0, 18: 0, 19: 0,
        20: 0, 21: 0, 22: 0, 23: 0
      }
    }; this.globalContext.requests = {
      total: 0,
      0: 0, 1: 0, 2: 0, 3: 0,
      4: 0, 5: 0, 6: 0, 7: 0,
      8: 0, 9: 0, 10: 0, 11: 0,
      12: 0, 13: 0, 14: 0, 15: 0,
      16: 0, 17: 0, 18: 0, 19: 0,
      20: 0, 21: 0, 22: 0, 23: 0
    }; if (restartHTTP) {
      await this.stop()
      await this.start()
    }

    return this
  }

  /** Stop the Server */
  stop() {
    this.server.close()
    this.globalContext.pageDisplay = ''
    this.globalContext.cache.files.clear()
    this.globalContext.cache.routes.clear()
    this.globalContext.cache.auths.clear()
    this.globalContext.routes.normal = this.optionsCache.normal
    this.globalContext.routes.event = this.optionsCache.event
    this.globalContext.routes.auth = this.optionsCache.auth
    this.globalContext.data = {
      incoming: {
        total: 0,
        0: 0, 1: 0, 2: 0, 3: 0,
        4: 0, 5: 0, 6: 0, 7: 0,
        8: 0, 9: 0, 10: 0, 11: 0,
        12: 0, 13: 0, 14: 0, 15: 0,
        16: 0, 17: 0, 18: 0, 19: 0,
        20: 0, 21: 0, 22: 0, 23: 0
      }, outgoing: {
        total: 0,
        0: 0, 1: 0, 2: 0, 3: 0,
        4: 0, 5: 0, 6: 0, 7: 0,
        8: 0, 9: 0, 10: 0, 11: 0,
        12: 0, 13: 0, 14: 0, 15: 0,
        16: 0, 17: 0, 18: 0, 19: 0,
        20: 0, 21: 0, 22: 0, 23: 0
      }
    }; this.globalContext.requests = {
      total: 0,
      0: 0, 1: 0, 2: 0, 3: 0,
      4: 0, 5: 0, 6: 0, 7: 0,
      8: 0, 9: 0, 10: 0, 11: 0,
      12: 0, 13: 0, 14: 0, 15: 0,
      16: 0, 17: 0, 18: 0, 19: 0,
      20: 0, 21: 0, 22: 0, 23: 0
    }; return new Promise((resolve: (value: ServerEvents.StopSuccess) => void, reject: (reason: ServerEvents.StopError) => void) => {
			this.server.once('close', () => resolve({ success: true, message: 'WEBSERVER CLOSED' }))
			this.server.once('error', (error: Error) => reject({ success: false, error, message: 'WEBSERVER CLOSING ERRORED' }))
		})
  }
}