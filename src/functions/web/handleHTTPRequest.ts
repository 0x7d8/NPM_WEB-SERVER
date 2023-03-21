import { pathParser } from "../../classes/router"
import { GlobalContext, RequestContext } from "../../interfaces/context"
import EventEmitter from "events"
import handleCompressType, { CompressMapping } from "../handleCompressType"
import ValueCollection from "../../classes/valueCollection"
import handleCompression from "../handleCompression"
import statsRoute from "../../stats/routes"
import handleEvent from "../handleEvent"
import { HTTPRequestContext } from "../../interfaces/external"
import { HttpRequest, HttpResponse } from "uWebSockets.js"
import handleContentType from "../handleContentType"
import parseContent, { Returns as ParseContentReturns } from "../parseContent"
import Static from "../../interfaces/static"
import { Version } from "../.."

import queryUrl from "querystring"
import path from "path"
import url from "url"
import fs from "fs"

export const getPreviousHours = () =>
	Array.from({ length: 5 }, (_, i) => (new Date().getHours() - (4 - i) + 24) % 24)

export default async function handleHTTPRequest(req: HttpRequest, res: HttpResponse, ctg: GlobalContext) {
	// Create Local ConTeXt
	let ctx: RequestContext = {
		content: Buffer.alloc(0),
		compressed: false,
		events: new EventEmitter(),
		waiting: false,
		continue: true,
		handleError: () => null,
		status: 200,
		headers: {},
		sendHeaders: {},
		remote: Buffer.from(res.getRemoteAddressAsText()),
		execute: {
			route: null,
			file: null,
			exists: false,
			dashboard: false
		}, body: {
			chunks: [],
			raw: Buffer.alloc(0),
			parsed: ''
		}, url: { ...url.parse(pathParser(req.getUrl() + '?' + req.getQuery())), method: req.getMethod().toUpperCase() as any },
		previousHours: getPreviousHours()
	}; ctx.url.pathname = decodeURI(ctx.url.pathname)

	// Parse Headers
	req.forEach((key, value) => {
		ctx.headers[key] = value
	})

	// Handle Wait Events
	ctx.events.on('noWaiting', () => ctx.waiting = false)
	res.onAborted(() => ctx.events.emit('endRequest'))

	// Save & Check Request Body
	if (ctg.options.body.enabled && !['GET', 'HEAD'].includes(ctx.url.method)) res.onData(async(data, isLast) => {
		ctx.body.chunks.push(Buffer.from(data))

		ctg.data.incoming.total += data.byteLength
		ctg.data.incoming[ctx.previousHours[4]] += data.byteLength

		if (isLast) {
			ctx.body.raw = Buffer.concat(ctx.body.chunks)
			ctx.body.chunks = []

			if (ctx.body.raw.byteLength >= (ctg.options.body.maxSize * 1e6)) {
				res.writeStatus('413')
				ctx.continue = false

				const result = await parseContent(ctg.options.body.message)

				for (const header in result.headers) {
					ctx.sendHeaders[header] = result.headers[header]
				}

				ctx.content = result.content
				return handleCompression({ headers: new ValueCollection(ctx.headers, decodeURIComponent), rawRes: res } as any, ctx, ctg, false)
			}

			if (ctx.continue) ctx.events.emit('startRequest')
		}
	})

	ctx.events.once('startRequest', async() => {
		let endRequest = false
		ctx.events.once('endRequest', () => endRequest = true)

		// Add X-Powered-By Header (if enabled)
		if (ctg.options.poweredBy) ctx.sendHeaders['rjweb-server'] = Version

		// Add Headers
		Object.keys(ctg.options.headers).forEach((key) => {
			ctx.sendHeaders[key] = ctg.options.headers[key]
		})

		// Handle CORS Requests
		if (ctg.options.cors) {
			ctx.sendHeaders['Access-Control-Allow-Headers'] = '*'
			ctx.sendHeaders['Access-Control-Allow-Origin'] = '*'
			ctx.sendHeaders['Access-Control-Request-Method'] = '*'
			ctx.sendHeaders['Access-Control-Allow-Methods'] = '*'
			if (endRequest) return

			for (const header in ctx.sendHeaders) {
				res.writeHeader(header, ctx.sendHeaders[header])
			}; if (ctx.url.method === 'OPTIONS') return res.end('')
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
			if (url.method !== ctx.url.method) continue
			if (url.pathArray.length !== actualUrl.length) continue

			// Check for Static Paths
			if (url.path === ctx.url.pathname && url.method === ctx.url.method) {
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

		// Get Correct Host IP
		let hostIp: string
		if (ctg.options.proxy && ctx.headers['x-forwarded-for']) hostIp = ctx.headers['x-forwarded-for']
		else hostIp = ctx.remote.toString().split(':')[0]

		// Turn Cookies into Object
		let cookies = {}
		if (ctx.headers['cookie']) ctx.headers['cookie'].split(';').forEach((cookie) => {
			const parts = cookie.split('=')
			cookies[parts.shift().trim()] = parts.join('=')
		})

		// Parse Request Body
		if (ctg.options.body.parse && ctx.headers['content-type'] === 'application/json') {
			try { ctx.body.parsed = JSON.parse(ctx.body.raw.toString()) }
			catch (err) { ctx.body.parsed = ctx.body.raw.toString() }
		} else ctx.body.parsed = ctx.body.raw.toString()

		// Create Context Response Object
		let ctr: HTTPRequestContext = {
			// Properties
			controller: ctg.controller,
			headers: new ValueCollection(ctx.headers, decodeURIComponent),
			cookies: new ValueCollection(cookies, decodeURIComponent),
			params: new ValueCollection(params, decodeURIComponent),
			queries: new ValueCollection(queryUrl.parse(ctx.url.query) as any, decodeURIComponent),

			// Variables
			client: {
				userAgent: ctx.headers['user-agent'],
				port: Number(ctx.remote.toString().split(':')[1]),
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
				ctx.sendHeaders[name] = value

				return ctr
			}, setCustom(name, value) {
				ctr['@'][name] = value

				return ctr
			}, status(code) {
				res.writeStatus(String(code ?? 200))
				ctx.status = code

				return ctr
			}, redirect(location, statusCode) {
				ctr.status(statusCode ?? 302)
				ctx.sendHeaders['Location'] = location
				ctx.events.emit('noWaiting')

				return ctr
			}, print(message, options = {}) {
				const contentType = options?.contentType ?? ''
				ctx.events.emit('noWaiting')

				ctx.waiting = true; ((async() => {
					let result: ParseContentReturns
					try {
						result = await parseContent(message)
					} catch (err) {
						return ctx.handleError(err)
					}

					if (contentType) ctx.sendHeaders['Content-Type'] = contentType
					for (const header in result.headers) {
						ctx.sendHeaders[header] = result.headers[header]
					}

					ctx.content = result.content

					ctx.events.emit('noWaiting')
				})) ()

				return ctr
			}, printFile(file, options = {}) {
				const addTypes = options?.addTypes ?? true
				const contentType = options?.contentType ?? ''
				const cache = options?.cache ?? false

				// Add Content Types
				if (addTypes && !contentType) ctx.sendHeaders['Content-Type'] = handleContentType(file, ctg)
				else if (contentType) ctx.sendHeaders['Content-Type'] = contentType

				// Get File Content
				let stream: fs.ReadStream, errorStop = false
				if (ctr.headers.get('accept-encoding', '').includes(CompressMapping[ctg.options.compression])) {
					ctx.sendHeaders['Content-Encoding'] = CompressMapping[ctg.options.compression]
					ctx.sendHeaders['Vary'] = 'Accept-Encoding'

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
					try { stream = fs.createReadStream(file); ctx.waiting = true; stream.pipe(compression) }
					catch (err) { errorStop = true; handleEvent('runtimeError', ctr, ctx, ctg, err) }
					if (errorStop) return

					// Collect Data
					ctx.events.once('endRequest', () => stream.destroy())
					compression.on('data', (content: Buffer) => {
						ctg.data.outgoing.total += content.byteLength
						ctg.data.outgoing[ctx.previousHours[4]] += content.byteLength

						res.write(content)

						// Write to Cache Store
						if (cache) {
							const oldData = ctg.cache.files.get(`file::${ctg.options.compression}::${file}`) ?? Buffer.from('')
							ctg.cache.files.set(`file::${ctg.options.compression}::${file}`, Buffer.concat([ oldData as Buffer, content ]))
						}
					}); compression.once('close', () => { ctx.events.emit('noWaiting'); ctx.content = Buffer.from('') })
				} else {
					try { stream = fs.createReadStream(file); ctx.waiting = true }
					catch (err) { errorStop = true; handleEvent('runtimeError', ctr, ctx, ctg, err) }

					// Collect Data
					ctx.events.once('endRequest', () => stream.destroy())
					stream.on('data', (content: Buffer) => {
						ctg.data.outgoing.total += content.byteLength
						ctg.data.outgoing[ctx.previousHours[4]] += content.byteLength

						res.write(content)

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

				const dataListener = async(data: Buffer) => {
					try {
						data = (await parseContent(data)).content
					} catch (err) {
						return ctx.handleError(err)
					}

					res.write(data)

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

		// Execute Middleware
		let errorStop = false

		ctx.handleError = (err) => {
			errorStop = true
			handleEvent('runtimeError', ctr, ctx, ctg, err)
				.then(() => ctx.events.emit('noWaiting'))
		}

		if (ctg.middlewares.length > 0) {
			let doContinue = true, runError = null
			for (let middlewareIndex = 0; middlewareIndex <= ctg.middlewares.length - 1; middlewareIndex++) {
				const middleware = ctg.middlewares[middlewareIndex]

				try {
					await Promise.resolve(middleware.code(ctr, ctx, ctg))
					if (!String(ctx.status).startsWith('2')) doContinue = false
				} catch (err) {
					doContinue = false
					runError = err
				}

				if (!doContinue && runError) {
					errorStop = true
					ctx.handleError(runError)
				}; if (!doContinue) {
					if (!ctx.sendHeaders['Content-Type']) ctx.sendHeaders['Content-Type'] = 'text/plain'
					handleCompression(ctr, ctx, ctg, endRequest)
					break
				}
			}

			if (!doContinue) return
		}; if (errorStop) return

		// Execute Custom Run Function
		if (!ctx.execute.dashboard) errorStop = await handleEvent('httpRequest', ctr, ctx, ctg)
		if (errorStop) return

		// Execute Validations
		if (ctx.execute.exists && ctx.execute.route.data.validations.length > 0) {
			let doContinue = true, runError = null
			for (let validateIndex = 0; validateIndex <= ctx.execute.route.data.validations.length - 1; validateIndex++) {
				const validate = ctx.execute.route.data.validations[validateIndex]

				try {
					await Promise.resolve(validate(ctr))
					if (!String(ctx.status).startsWith('2')) doContinue = false
				} catch (err) {
					doContinue = false
					runError = err
				}

				if (!doContinue && runError) {
					errorStop = true
					ctx.handleError(runError)
				}; if (!doContinue) {
					if (!ctx.sendHeaders['Content-Type']) ctx.sendHeaders['Content-Type'] = 'text/plain'
					handleCompression(ctr, ctx, ctg, endRequest)
					break
				}
			}

			if (!doContinue) return
		}; if (errorStop) return

		// Execute Page
		if (ctg.options.dashboard.enabled && !ctx.execute.dashboard) {
			ctg.requests.total++
			ctg.requests[ctx.previousHours[4]]++
		}; if (ctx.waiting) if (await new Promise((resolve) => {
			ctx.events.once('noWaiting', () => resolve(false))
			ctx.events.once('endRequest', () => resolve(true))
		})) return

		if (ctx.execute.exists && !errorStop) {
			if (ctx.execute.route.type === 'static') {
				// Add Content Types
				if (ctx.execute.route.data.addTypes) ctx.sendHeaders['Content-Type'] = handleContentType(ctx.execute.file, ctg)

				// Read Content
				ctx.continue = false

				// Get File Content
				let stream: fs.ReadStream, errorStop = false
				if (ctg.options.compression && ctr.headers.get('accept-encoding', '').includes(CompressMapping[ctg.options.compression])) {
					ctx.sendHeaders['Content-Encoding'] = CompressMapping[ctg.options.compression]
					ctx.sendHeaders['Vary'] = 'Accept-Encoding'

					const compression = handleCompressType(ctg.options.compression)
					try { stream = fs.createReadStream(ctx.execute.file); ctx.waiting = true; stream.pipe(compression) }
					catch (err) { errorStop = true; handleEvent('runtimeError', ctr, ctx, ctg, err) }
					if (errorStop) return

					// Write Headers
					for (const header in ctx.sendHeaders) {
						if (!endRequest) res.writeHeader(header, ctx.sendHeaders[header])
					}

					// Write to Total Network
					compression.on('data', (content: Buffer) => {
						ctg.data.outgoing.total += content.byteLength
						ctg.data.outgoing[ctx.previousHours[4]] += content.byteLength

						if (!endRequest) res.write(content)
					}).once('end', () => {
						ctx.events.emit('noWaiting')
						ctx.content = Buffer.alloc(0)
					})

					ctx.events.once('endRequest', () => { stream.destroy(); compression.destroy() })
				} else {
					try { stream = fs.createReadStream(ctx.execute.file); ctx.waiting = true }
					catch (err) { errorStop = true; handleEvent('runtimeError', ctr, ctx, ctg, err) }

					// Write Headers
					for (const header in ctx.sendHeaders) {
						if (!endRequest) res.writeHeader(header, ctx.sendHeaders[header])
					}

					// Write to Total Network
					stream.on('data', (content: Buffer) => {
						ctg.data.outgoing.total += content.byteLength
						ctg.data.outgoing[ctx.previousHours[4]] += content.byteLength

						if (!endRequest) res.write(content)
					}).once('end', () => {
						ctx.events.emit('noWaiting')
						ctx.content = Buffer.alloc(0)
					})

					ctx.events.once('endRequest', () => stream.destroy())
				}
			} else {
				try {
					await Promise.resolve(ctx.execute.route.code(ctr))
				} catch (err) {
					errorStop = true
					await handleEvent('runtimeError', ctr, ctx, ctg, err)
				}
			}

			// Wait for Streams
			if (ctx.waiting) await new Promise((resolve) => {
				ctx.events.once('noWaiting', () => resolve(false))
			}); if (ctx.content && ctx.continue) {
				handleCompression(ctr, ctx, ctg, endRequest)
			} else { if (!endRequest) res.end() }
		} else if (!errorStop) {
			await handleEvent('http404', ctr, ctx, ctg)

			// Wait for Streams
			if (ctx.waiting) await new Promise((resolve) => {
				ctx.events.once('noWaiting', () => resolve(false))
			}); if (ctx.content && ctx.continue) {
				handleCompression(ctr, ctx, ctg, endRequest)
			} else { if (!endRequest) res.end() }
		}
	})

	if (!ctg.options.body.enabled || ['GET', 'HEAD'].includes(ctx.url.method)) ctx.events.emit('startRequest')
}