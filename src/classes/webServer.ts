import * as ServerEvents from "../interfaces/serverEvents"
import { GlobalContext } from "../interfaces/context"
import ValueCollection from "./valueCollection"
import ServerOptions, { Options } from "./serverOptions"
import RouteList, { minifiedRoute, pathParser } from "./router"
import handleHTTPRequest, { getPreviousHours } from "../functions/web/handleHTTPRequest"
import { getAllFilesFilter } from "../misc/getAllFiles"

import http2 from "http2"
import http from "http"
import fs from "fs"

export default class Webserver extends RouteList {
  private globalContext: GlobalContext
  public server: http.Server | http2.Http2SecureServer

  /** Server Controller */
  constructor(
    /** The Server Options */ options: Options
  ) {
    super()

    this.globalContext = {
			controller: this,
      options: new ServerOptions(options ?? {}).getOptions(),
			requests: {
				total: 0,
				0: 0, 1: 0, 2: 0, 3: 0,
				4: 0, 5: 0, 6: 0, 7: 0,
				8: 0, 9: 0, 10: 0, 11: 0,
				12: 0, 13: 0, 14: 0, 15: 0,
				16: 0, 17: 0, 18: 0, 19: 0,
				20: 0, 21: 0, 22: 0, 23: 0
			}, data: {
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
			}, routes: {
				normal: [],
        static: [],
				event: [],
			}, cache: {
				files: new ValueCollection(),
				routes: new ValueCollection()
			}
		}

    if (this.globalContext.options.https.enabled) {
      let key: Buffer, cert: Buffer
      try {
        key = fs.readFileSync(this.globalContext.options.https.keyFile)
        cert = fs.readFileSync(this.globalContext.options.https.certFile)
      } catch (e) {
        throw new Error(`Cant access your HTTPS Key or Cert file! (${this.globalContext.options.https.keyFile} / ${this.globalContext.options.https.certFile})`)
      }

      this.server = http2.createSecureServer({
        key, cert, allowHTTP1: true
      })
    } else this.server = new http.Server()

    this.server.on('request', (req, res) => handleHTTPRequest(req, res, this.globalContext))

    // Stats Cleaner
    setInterval(() => {
			const previousHours = getPreviousHours()

			this.globalContext.requests[previousHours[0] - 1] = 0
			this.globalContext.data.incoming[previousHours[0] - 1] = 0
			this.globalContext.data.outgoing[previousHours[0] - 1] = 0
		}, 300000)
  }

  /** Set new Options for the Server */
  setOptions(
    /** The Options */ options: Partial<Options>
  ) {
    this.globalContext.options = new ServerOptions(options).getOptions()

    return this
  }

  /** Start the Server */
  start() {
    return new Promise(async(resolve: (value: ServerEvents.StartSuccess) => void, reject: (reason: ServerEvents.StartError) => void) => {
      let stopExecution = false
      await this.loadExternalPaths().catch((error) => {
        reject({ success: false, error, message: 'WEBSERVER ERRORED' })
        stopExecution = true
      })

      if (stopExecution) return

      this.globalContext.routes.normal = this.routes
      this.globalContext.routes.event = this.events
      this.globalContext.routes.static = this.statics

      this.server.listen(this.globalContext.options.port, this.globalContext.options.bind)
			this.server.once('listening', () => resolve({ success: true, port: this.globalContext.options.port, message: 'WEBSERVER STARTED' }))
			this.server.once('error', (error: Error) => { this.server.close(); reject({ success: false, error, message: 'WEBSERVER ERRORED' }) })
		})
  }

  /** Load all Server Routes & Options */
  async reload(
    /** Whether to restart the HTTP Server itself */ restartHTTP?: boolean
  ) {
    this.globalContext.cache.files.clear()
    this.globalContext.cache.routes.clear()

    await this.loadExternalPaths()

    this.globalContext.routes.normal = this.routes
    this.globalContext.routes.event = this.events
    this.globalContext.routes.static = this.statics

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
    this.globalContext.cache.files.clear()
    this.globalContext.cache.routes.clear()

    this.globalContext.routes.normal = this.routes
    this.globalContext.routes.event = this.events
    this.globalContext.routes.static = this.statics

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


  private async loadExternalPaths() {
    for (const loadPath of this.loadPaths) {
      if (loadPath.type === 'cjs') {
        for (const file of getAllFilesFilter(loadPath.path, 'js')) {
          const route: minifiedRoute = require(file)

          if (
            !('method' in route) ||
            !('path' in route) ||
            !('code' in route)
          ) throw new Error(`Invalid Route at ${file}`)

          this.routes.push({
            method: route.method,
            path: loadPath.prefix + pathParser(route.path),
            pathArray: (loadPath.prefix + pathParser(route.path)).split('/'),
            code: route.code,
            data: {
              addTypes: false,
              validations: loadPath.validations
            }
          })
        }
      } else {
        for (const file of getAllFilesFilter(loadPath.path, 'js')) {
          const route: minifiedRoute = (await import(file)).default

          if (
            !('method' in route) ||
            !('path' in route) ||
            !('code' in route)
          ) throw new Error(`Invalid Route at ${file}`)

          this.routes.push({
            method: route.method,
            path: loadPath.prefix + pathParser(route.path),
            pathArray: (loadPath.prefix + pathParser(route.path)).split('/'),
            code: route.code,
            data: {
              addTypes: false,
              validations: loadPath.validations
            }
          })
        }
      }
    }
  }
}