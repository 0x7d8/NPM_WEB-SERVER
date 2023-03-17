import { pathParser } from "../../classes/router"
import { GlobalContext, RequestContext } from "../../interfaces/context"
import EventEmitter from "events"
import handleCompressType, { CompressMapping } from "../handleCompressType"
import ValueCollection from "../../classes/valueCollection"
import handleCompression from "../handleCompression"
import statsRoute from "../../stats/routes"
import handleEvent from "../handleEvent"
import { HTTPRequestContext } from "../../interfaces/external"
import { IncomingMessage, ServerResponse } from "http"
import { Http2ServerRequest, Http2ServerResponse } from "http2"
import handleContentType from "../handleContentType"
import Static from "../../interfaces/static"

import queryUrl from "querystring"
import zlib from "zlib"
import path from "path"
import url from "url"
import fs from "fs"

export const getPreviousHours = () =>
  Array.from({ length: 5 }, (_, i) => (new Date().getHours() - (4 - i) + 24) % 24)

export default async function handleHTTPRequest(req: IncomingMessage | Http2ServerRequest, res: ServerResponse | Http2ServerResponse, ctg: GlobalContext) {
  // Create Local ConTeXt
  let ctx: RequestContext = {
    content: Buffer.alloc(0),
    compressed: false,
    events: new EventEmitter(),
    waiting: false,
    continue: true,
    execute: {
      route: null,
      file: null,
      exists: false,
      dashboard: false
    }, body: {
      chunks: [],
      raw: Buffer.alloc(0),
      parsed: ''
    }, url: { ...url.parse(pathParser(req.url)), method: req.method as any },
    previousHours: getPreviousHours()
  }; ctx.url.pathname = decodeURI(ctx.url.pathname)

  // Handle Wait Events
  ctx.events.on('noWaiting', () => ctx.waiting = false)
  req.once('aborted', () => ctx.events.emit('endRequest'))
  res.once('close', () => ctx.events.emit('endRequest'))

  // Save & Check Request Body
  if (ctg.options.body.enabled) req.on('data', async(data: Buffer) => {
    ctx.body.chunks.push(data)

    ctg.data.incoming.total += data.byteLength
    ctg.data.incoming[ctx.previousHours[4]] += data.byteLength
  }).once('end', () => {
    ctx.body.raw = Buffer.concat(ctx.body.chunks)
    ctx.body.chunks = []

    if (ctx.body.raw.byteLength >= (ctg.options.body.maxSize * 1e6)) {
      res.statusCode = 413
      ctx.continue = false
      switch (typeof ctg.options.body.message) {
        case "object":
          res.setHeader('Content-Type', 'application/json')
          ctx.content = Buffer.from(JSON.stringify(ctg.options.body.message))
          break

        case "string":
          ctx.content = Buffer.from(ctg.options.body.message)
          break

        case "symbol":
          ctx.content = Buffer.from(ctg.options.body.message.toString())
          break

        case "bigint":
        case "number":
        case "boolean":
          ctx.content = Buffer.from(String(ctg.options.body.message))
          break

        case "undefined":
          ctx.content = Buffer.from('')
          break
      }; return handleCompression({ headers: new ValueCollection(req.headers as any, decodeURIComponent), rawRes: res } as any, ctx, ctg)
    }

    if (ctx.continue) ctx.events.emit('startRequest')
  })

  ctx.events.once('startRequest', async() => {
    // Add Headers
    Object.keys(ctg.options.headers).forEach((key) => {
      res.setHeader(key, ctg.options.headers[key])
    })

    // Handle CORS Requests
    if (ctg.options.cors) {
      res.setHeader('Access-Control-Allow-Headers', '*')
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Access-Control-Request-Method', '*')
      res.setHeader('Access-Control-Allow-Methods', '*')
      if (req.method === 'OPTIONS') return res.end('')
    }

    // Check if URL exists
    let params = {}
    const actualUrl = ctx.url.pathname.split('/')

    // Check Static Paths
    const foundStatic = (file: string, url: Static) => {
      ctx.execute.file = file
      ctx.execute.route = url
      ctx.execute.exists = true
    }; for (let staticNumber = 0; staticNumber <= ctg.routes.static.length - 1; staticNumber++) {
      if (ctx.execute.exists) break

      const url = ctg.routes.static[staticNumber]

      // Get From Cache
      if (ctg.cache.routes.has(`route::static::${ctx.url.pathname}`)) {
        const url = ctg.cache.routes.get(`route::static::${ctx.url.pathname}`)

        ctx.execute.file = url.file
        ctx.execute.route = url.route
        ctx.execute.exists = true

        break
      }

      // Skip if not related
      if (!ctx.url.pathname.startsWith(url.path)) continue

      // Find File
      const urlPath = pathParser(ctx.url.pathname.replace(url.path, '')).substring(1)

      const fileExists = async(location: string) => {
        location = path.resolve(location)

        try {
          const res = await fs.promises.stat(location)
          return res.isFile()
        } catch (err) {
          return false
        }
      }

      if (url.data.hideHTML) {
        if (await fileExists(url.location + '/' + urlPath + '/index.html')) foundStatic(path.resolve(url.location + '/' + urlPath + '/index.html'), url)
        else if (await fileExists(url.location + '/' + urlPath + '.html')) foundStatic(path.resolve(url.location + '/' + urlPath + '.html'), url)
        else if (await fileExists(url.location + '/' + urlPath)) foundStatic(path.resolve(url.location + '/' + urlPath), url)
      } else if (await fileExists(url.location + '/' + urlPath)) foundStatic(path.resolve(url.location + '/' + urlPath), url)
    }

    // Check Dashboard Paths
    if (ctg.options.dashboard.enabled && (ctx.url.pathname === pathParser(ctg.options.dashboard.path) || ctx.url.pathname === pathParser(ctg.options.dashboard.path) + '/stats')) {
      ctx.execute.route = {
        type: 'route',
        method: 'GET',
        path: ctx.url.path,
        pathArray: ctx.url.path.split('/'),
        code: async(ctr) => await statsRoute(ctr, ctg, ctx),
        data: {
          validations: []
        }
      }

      ctx.execute.exists = true
      ctx.execute.dashboard = true
    }

    // Check Other Paths
    for (let urlNumber = 0; urlNumber <= ctg.routes.normal.length - 1; urlNumber++) {
      if (ctx.execute.exists) break

      const url = ctg.routes.normal[urlNumber]

      // Get From Cache
      if (ctg.cache.routes.has(`route::normal::${ctx.url.pathname}`)) {
        const url = ctg.cache.routes.get(`route::normal::${ctx.url.pathname}`)

        params = url.params
        ctx.execute.route = url.route
        ctx.execute.exists = true

        break
      }

      // Skip if not related
      if (url.method !== req.method) continue
      if (url.pathArray.length !== actualUrl.length) continue

      // Check for Static Paths
      if (url.path === ctx.url.pathname && url.method === req.method) {
        ctx.execute.route = url
        ctx.execute.exists = true

        // Set Cache
        ctg.cache.routes.set(`route::normal::${ctx.url.pathname}`, { route: url, params: {} })

        break
      }

      // Check Parameters
      for (let partNumber = 0; partNumber <= url.pathArray.length - 1; partNumber++) {
        const urlParam = url.pathArray[partNumber]
        const reqParam = actualUrl[partNumber]

        if (!/^<.*>$/.test(urlParam) && reqParam !== urlParam) {
          ctx.execute.exists = false
          break
        } else if (urlParam === reqParam) continue
        else if (/^<.*>$/.test(urlParam)) {
          params[urlParam.substring(1, urlParam.length - 1)] = reqParam
          ctx.execute.route = url
          ctx.execute.exists = true

          continue
        }; continue
      }; if (ctx.execute.exists) {
        // Set Cache
        ctg.cache.routes.set(`route::normal::${ctx.url.pathname}`, { route: url, params: params })
        break
      }

      continue
    }

    // Add X-Powered-By Header (if enabled)
    if (ctg.options.poweredBy) res.setHeader('X-Powered-By', 'rjweb-server')

    // Get Correct Host IP
    let hostIp: string
    if (ctg.options.proxy && req.headers['x-forwarded-for']) hostIp = req.headers['x-forwarded-for'] as string
    else hostIp = req.socket.remoteAddress

    // Turn Cookies into Object
    let cookies = {}
    if (req.headers.cookie) req.headers.cookie.split(';').forEach((cookie) => {
      const parts = cookie.split('=')
      cookies[parts.shift().trim()] = parts.join('=')
    })

    // Parse Request Body
    if (ctg.options.body.parse) {
      try { ctx.body.parsed = JSON.parse(ctx.body.raw.toString()) }
      catch (err) { ctx.body.parsed = ctx.body.raw.toString() }
    } else ctx.body.parsed = ctx.body.raw.toString()

    // Create Context Response Object
    let ctr: HTTPRequestContext = {
      // Properties
      controller: ctg.controller,
      headers: new ValueCollection(req.headers as any, decodeURIComponent),
      cookies: new ValueCollection(cookies, decodeURIComponent),
      params: new ValueCollection(params, decodeURIComponent),
      queries: new ValueCollection(queryUrl.parse(ctx.url.query) as any, decodeURIComponent),

      // Variables
      client: {
        userAgent: req.headers['user-agent'],
        httpVersion: req.httpVersion,
        port: req.socket.remotePort,
        ip: hostIp
      }, body: ctx.body.parsed,
      url: ctx.url,

      // Raw Values
      rawReq: req,
      rawRes: res,

      // Custom Variables
      '@': {},

      // Functions
      setHeader(name, value) {
        res.setHeader(name, value)

        return ctr
      }, setCustom(name, value) {
        ctr['@'][name] = value

        return ctr
      }, status(code) {
        res.statusCode = code ?? 200

        return ctr
      }, redirect(location, statusCode) {
        res.statusCode = statusCode ?? 302
        res.setHeader('Location', location)
        ctx.events.emit('noWaiting')

        return ctr
      }, print(message, options = {}) {
        const contentType = options?.contentType ?? ''
        const returnFunctions = options?.returnFunctions ?? false
        ctx.events.emit('noWaiting')

        switch (typeof message) {
          case "object":
            res.setHeader('Content-Type', 'application/json')
            ctx.content = Buffer.from(JSON.stringify(message))
            break

          case "string":
            if (contentType) res.setHeader('Content-Type', contentType)
            ctx.content = Buffer.from(message)
            break

          case "symbol":
            if (contentType) res.setHeader('Content-Type', contentType)
            ctx.content = Buffer.from(message.toString())
            break

          case "bigint":
          case "number":
          case "boolean":
            if (contentType) res.setHeader('Content-Type', contentType)
            ctx.content = Buffer.from(String(message))
            break

          case "function":
            ctx.waiting = true; (async() => {
              const result = await message()
              if (typeof result !== 'function') ctr.print(result, { contentType })
              else if (!returnFunctions) { (ctr as any).error = new Error('Cant return functions from functions, consider using async/await'); return handleEvent('error', ctr, ctx, ctg) }
              else { ctr.print(result, { contentType, returnFunctions }) }

              ctx.events.emit('noWaiting')
            }) ()
            break

          case "undefined":
            if (contentType) res.setHeader('Content-Type', contentType)
            ctx.content = Buffer.from('')
            break
        }

        return ctr
      }, printFile(file, options = {}) {
        const addTypes = options?.addTypes ?? true
        const contentType = options?.contentType ?? ''
        const cache = options?.cache ?? false

        // Add Content Types
        if (addTypes && !contentType) ctr.setHeader('Content-Type', handleContentType(file, ctg))
        else if (contentType) res.setHeader('Content-Type', contentType)

        // Get File Content
        let stream: fs.ReadStream, errorStop = false
        if (ctr.headers.get('accept-encoding', '').includes(CompressMapping[ctg.options.compression])) {
          res.setHeader('Content-Encoding', CompressMapping[ctg.options.compression])
          res.setHeader('Vary', 'Accept-Encoding')

          // Check Cache
          ctx.continue = false
          if (ctg.cache.files.has(`file::${file}`)) {
            ctg.data.outgoing.total += (ctg.cache.files.get(`file::${file}`) as Buffer).byteLength
            ctg.data.outgoing[ctx.previousHours[4]] += (ctg.cache.files.get(`file::${file}`) as Buffer).byteLength
            ctx.content = (ctg.cache.files.get(`file::${file}`) as Buffer)
            ctx.continue = true

            return ctr
          } else if (ctg.cache.files.has(`file::${ctg.options.compression}::${file}`)) {
            ctx.compressed = true
            ctg.data.outgoing.total += (ctg.cache.files.get(`file::${ctg.options.compression}::${file}`) as Buffer).byteLength
            ctg.data.outgoing[ctx.previousHours[4]] += (ctg.cache.files.get(`file::${ctg.options.compression}::${file}`) as Buffer).byteLength
            ctx.content = (ctg.cache.files.get(`file::${ctg.options.compression}::${file}`) as Buffer)
            ctx.continue = true

            return ctr
          }

          const compression = handleCompressType(ctg.options.compression)
          try { stream = fs.createReadStream(file); ctx.waiting = true; stream.pipe(compression); compression.pipe(res) }
          catch (err) { errorStop = true; ctr.error = err; handleEvent('error', ctr, ctx, ctg) }
          if (errorStop) return

          // Collect Data
          ctx.events.once('endRequest', () => stream.destroy())
          compression.on('data', (content: Buffer) => {
            ctg.data.outgoing.total += content.byteLength
            ctg.data.outgoing[ctx.previousHours[4]] += content.byteLength

            // Write to Cache Store
            if (cache) {
              const oldData = ctg.cache.files.get(`file::${ctg.options.compression}::${file}`) ?? Buffer.from('')
              ctg.cache.files.set(`file::${ctg.options.compression}::${file}`, Buffer.concat([ oldData as Buffer, content ]))
            }
          }); compression.once('close', () => { ctx.events.emit('noWaiting'); ctx.content = Buffer.from('') })
        } else {
          try { stream = fs.createReadStream(file); ctx.waiting = true; stream.pipe(res) }
          catch (err) { errorStop = true; ctr.error = err; handleEvent('error', ctr, ctx, ctg) }

          // Collect Data
          ctx.events.once('endRequest', () => stream.destroy())
          stream.on('data', (content: Buffer) => {
            ctg.data.outgoing.total += content.byteLength
            ctg.data.outgoing[ctx.previousHours[4]] += content.byteLength

            // Write to Cache Store
            if (cache) {
              const oldData = ctg.cache.files.get(`file::${ctg.options.compression}::${file}`) ?? Buffer.from('')
              ctg.cache.files.set(`file::${ctg.options.compression}::${file}`, Buffer.concat([ oldData as Buffer, content ]))
            }
          }); stream.once('close', () => { ctx.events.emit('noWaiting'); ctx.content = Buffer.from('') })
        }

        return ctr
      }, printStream(stream, options = {}) {
        const endRequest = options?.endRequest ?? true
        const destroyAbort = options?.destroyAbort ?? true

        ctx.waiting = true

        const dataListener = (data: Buffer) => {
          if (!Buffer.isBuffer(data)) {
            const oldContent = Buffer.concat([ ctx.content ])
            ctr.print(data)
            data = Buffer.from(ctx.content)
            ctx.content = oldContent
          }

          res.write(data, 'binary')

          ctg.data.outgoing.total += data.byteLength
          ctg.data.outgoing[ctx.previousHours[4]] += data.byteLength
        }, closeListener = () => {
          if (endRequest) ctx.events.emit('noWaiting')
        }

        if (destroyAbort) ctx.events.once('endRequest', () => stream.destroy())

        stream
          .on('data', dataListener)
          .once('close', closeListener)

        ctx.events.once('endRequest', () => stream
          .removeListener('data', dataListener)
          .removeListener('close', closeListener))

        return ctr
      }
    }

    // Execute Custom Run Function
    let errorStop = false
    if (!ctx.execute.dashboard) errorStop = await handleEvent('request', ctr, ctx, ctg)
    if (errorStop) return

    // Rate Limiting
    if (ctg.options.rateLimits.enabled) {
      for (const rule of ctg.options.rateLimits.list) {
        if (ctx.url.pathname.startsWith(rule.path)) {
          res.setHeader('X-RateLimit-Limit', rule.times)
          res.setHeader('X-RateLimit-Remaining', rule.times - (await ctg.options.rateLimits.functions.get(hostIp + rule.path) ?? 0))
          res.setHeader('X-RateLimit-Reset-Every', rule.timeout)

          await ctg.options.rateLimits.functions.set(hostIp + rule.path, (await ctg.options.rateLimits.functions.get(hostIp + rule.path) ?? 0) + 1)
          setTimeout(async() => { await ctg.options.rateLimits.functions.set(hostIp + rule.path, (await ctg.options.rateLimits.functions.get(hostIp + rule.path) ?? 0) - 1) }, rule.timeout)
          if (await ctg.options.rateLimits.functions.get(hostIp + rule.path) > rule.times) {
            res.statusCode = 429
            errorStop = true
            ctr.print(ctg.options.rateLimits.message)
            return handleCompression(ctr, ctx, ctg)
          }
        }
      }
    }

    // Execute Validations
    if (ctx.execute.exists && ctx.execute.route.data.validations.length > 0) {
      let doContinue = true, runError = null
      for (let authNumber = 0; authNumber <= ctx.execute.route.data.validations.length - 1; authNumber++) {
        const authCheck = ctx.execute.route.data.validations[authNumber]

        try {
          await Promise.resolve(authCheck(ctr))
          if (!String(res.statusCode).startsWith('2')) doContinue = false
        } catch (err) {
          doContinue = false
          runError = err
        }

        if (!doContinue && runError) {
          ctr.error = runError
          errorStop = true
          handleEvent('error', ctr, ctx, ctg)
          break
        } else if (!doContinue) {
          if (!res.getHeader('Content-Type')) ctr.setHeader('Content-Type', 'text/plain')
          handleCompression(ctr, ctx, ctg)
          break
        }
      }

      if (!doContinue) return
    }

    // Execute Page
    if (ctg.options.dashboard.enabled && !ctx.execute.dashboard) {
      ctg.requests.total++
      ctg.requests[ctx.previousHours[4]]++
    }; if (await new Promise((resolve) => {
      if (!ctx.waiting) return resolve(false)
      ctx.events.once('noWaiting', () => resolve(false))
      ctx.events.once('endRequest', () => resolve(true))
    })) return

    if (ctx.execute.exists && !errorStop) {
      if (ctx.execute.route.type === 'static') {
        // Add Content Types
        if (ctx.execute.route.data.addTypes) res.setHeader('Content-Type', handleContentType(ctx.execute.file, ctg))

        // Read Content
        ctx.continue = false

        // Get File Content
        let stream: fs.ReadStream, errorStop = false
        if (ctg.options.compression && ctr.headers.get('accept-encoding', '').includes(CompressMapping[ctg.options.compression])) {
          ctr.rawRes.setHeader('Content-Encoding', CompressMapping[ctg.options.compression])
          ctr.rawRes.setHeader('Vary', 'Accept-Encoding')

          const compression = handleCompressType(ctg.options.compression)
          try { stream = fs.createReadStream(ctx.execute.file); ctx.waiting = true; stream.pipe(compression); compression.pipe(res) }
          catch (err) { errorStop = true; ctr.error = err; handleEvent('error', ctr, ctx, ctg) }
          if (errorStop) return

          // Write to Total Network
          compression.on('data', (content: Buffer) => {
            ctg.data.outgoing.total += content.byteLength
            ctg.data.outgoing[ctx.previousHours[4]] += content.byteLength
          }); compression.once('end', () => { ctx.events.emit('noWaiting'); ctx.content = Buffer.from('') })
          res.once('close', () => { stream.close(); compression.close() })
        } else {
          try { stream = fs.createReadStream(ctx.execute.file); ctx.waiting = true; stream.pipe(res) }
          catch (err) { errorStop = true; ctr.error = err; handleEvent('error', ctr, ctx, ctg) }

          // Write to Total Network
          stream.on('data', (content: Buffer) => {
            ctg.data.outgoing.total += content.byteLength
            ctg.data.outgoing[ctx.previousHours[4]] += content.byteLength
          }); stream.once('end', () => { ctx.events.emit('noWaiting'); ctx.content = Buffer.from('') })
          res.once('close', () => stream.close())
        }
      } else {
        try {
          await Promise.resolve(ctx.execute.route.code(ctr))
        } catch (err) {
          ctr.error = err
          errorStop = true
          handleEvent('error', ctr, ctx, ctg)
        }
      }

      // Wait for Streams
      await new Promise((resolve) => {
        if (!ctx.waiting) return resolve(true)
        ctx.events.once('noWaiting', () => resolve(false))
      }); if (ctx.content && ctx.continue) {
        handleCompression(ctr, ctx, ctg)
      } else res.end()
    } else if (!errorStop) {
      handleEvent('notfound', ctr, ctx, ctg)

      // Wait for Streams
      await new Promise((resolve) => {
        if (!ctx.waiting) return resolve(true)
        ctx.events.once('noWaiting', () => resolve(false))
      }); if (ctx.content && ctx.continue) {
        handleCompression(ctr, ctx, ctg)
      } else res.end()
    }
  }); if (!ctg.options.body.enabled) ctx.events.emit('startRequest')
}