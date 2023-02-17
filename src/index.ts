import ctr from "./interfaces/ctr"
import routeList, { pathParser } from "./classes/routeList"
import serverOptions, { Options } from "./classes/serverOptions"
import valueCollection from "./classes/valueCollection"
import typesEnum from "./interfaces/methods"
import { Events as eventsType } from "./interfaces/event"
import handleCompressType, { CompressMapping } from "./functions/handleCompressType"
import { GlobalContext, RequestContext } from "./interfaces/context"
import handleCompression from "./functions/handleCompression"
import ServerController from "./classes/serverController"
import { EventEmitter } from "stream"
import statsRoute from "./stats/routes"
import types from "./misc/methods"

import * as http from "http"
import * as https from "https"
import * as queryUrl from "querystring"
import * as zlib from "zlib"
import * as path from "path"
import * as url from "url"
import * as fs from "fs"

export = {
	/** The RouteList */ routeList,
	/** The ServerOptions */ serverOptions,
	/** The ValueCollection */ valueCollection,
	/** The Request Types */ types: typesEnum,

	/** Initialize The Webserver */
	initialize(
		/** Required Options */ options: Options
	) {
		options = new serverOptions(options).getOptions()

		let ctg: GlobalContext = {
			controller: null,
			requests: {
				total: 0,
				0: 0, 1: 0, 2: 0, 3: 0,
				4: 0, 5: 0, 6: 0, 7: 0,
				8: 0, 9: 0, 10: 0, 11: 0,
				12: 0, 13: 0, 14: 0, 15: 0,
				16: 0, 17: 0, 18: 0, 19: 0,
				20: 0, 21: 0, 22: 0, 23: 0
			}, pageDisplay: '',
			data: {
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
				event: [],
				auth: [],
			}, cache: {
				files: new valueCollection(),
				routes: new valueCollection(),
				auths: new valueCollection()
			}
		}

		const eventHandler = async(event: eventsType, ctr: ctr, ctx: RequestContext) => {
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
						Promise.resolve(event.code(ctr as any as ctr<any, true>)).catch((e) => {
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
						let pageDisplay = ''
						if (ctg.pageDisplay) pageDisplay = ctg.pageDisplay
						else {
							for (const url of ctg.routes.normal) {
								const type = (url.method === 'STATIC' ? 'GET' : url.method)
								pageDisplay += `[-] [${type}] ${url.path}\n`
							}; ctg.pageDisplay = pageDisplay
						}

						ctr.status(404).setHeader('Content-Type', 'text/plain')
						ctx.content = Buffer.from(`[!] COULDNT FIND [${ctr.url.method}]: ${ctr.url.pathname.toUpperCase()}\n[i] AVAILABLE PAGES:\n\n${pageDisplay}`)
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
		}; const getPreviousHours = () => {
			return Array.from({ length: 5 }, (_, i) => (new Date().getHours() - (4 - i) + 24) % 24)
		}

		// Clean Stats
		setInterval(() => {
			const previousHours = getPreviousHours()

			ctg.requests[previousHours[0] - 1] = 0
			ctg.data.incoming[previousHours[0] - 1] = 0
			ctg.data.outgoing[previousHours[0] - 1] = 0
		}, 300000)

		// Set HTTP Server Options
		let httpOptions = {}
		let key: Buffer, cert: Buffer
		if (options.https.enabled) {
			try {
				key = fs.readFileSync(options.https.keyFile)
				cert = fs.readFileSync(options.https.certFile)
			} catch (e) {
				throw new Error(`Cant access your HTTPS Key or Cert file! (${options.https.keyFile} / ${options.https.certFile})`)
			}; httpOptions = { key, cert }
		}

		// Initialize the HTTP Server
		const server = (options.https.enabled ? https as any : http as any).createServer(httpOptions, async(req: http.IncomingMessage, res: http.ServerResponse) => {
			// Create Local ConTeXt
			let ctx: RequestContext = {
				content: Buffer.from(''),
				compressed: false,
				events: new EventEmitter(),
				authChecks: [],
				waiting: false,
				continue: true,
				execute: {
					route: null,
					static: false,
					exists: false,
					dashboard: false
				}, body: {
					raw: Buffer.from(''),
					parsed: ''
				}, url: { ...url.parse(pathParser(req.url)), method: req.method as typesEnum },
				previousHours: getPreviousHours()
			}; ctx.url.pathname = decodeURI(ctx.url.pathname)

			// Handle Wait Events
			ctx.events.on('noWaiting', () => ctx.waiting = false)
			res.once('close', () => ctx.events.emit('endRequest'))

			// Save & Check Request Body
			if (options.body.enabled) req.on('data', (data: string) => {
				ctx.body.raw = Buffer.concat([ ctx.body.raw, Buffer.from(data) ])
				if (ctx.body.raw.byteLength >= (options.body.maxSize * 1e6)) {
					res.statusCode = 413
					ctx.continue = false
					switch (typeof options.body.message) {
						case "object":
							res.setHeader('Content-Type', 'application/json')
							ctx.content = Buffer.from(JSON.stringify(options.body.message))
							break

						case "string":
							ctx.content = Buffer.from(options.body.message)
							break

						case "symbol":
							ctx.content = Buffer.from(options.body.message.toString())
							break

						case "bigint":
						case "number":
						case "boolean":
							ctx.content = Buffer.from(String(options.body.message))
							break

						case "undefined":
							ctx.content = Buffer.from('')
							break
					}; return handleCompression({ headers: new valueCollection(req.headers as any, decodeURIComponent), rawRes: res } as any, ctx, options)
				} else {
					ctg.data.incoming.total += ctx.body.raw.byteLength
					ctg.data.incoming[ctx.previousHours[4]] += ctx.body.raw.byteLength
				}
			}).on('end', () => { if (ctx.continue) ctx.events.emit('startRequest') })
			ctx.events.once('startRequest', async() => {
				// Add Headers
				Object.keys(options.headers).forEach((key) => {
					res.setHeader(key, options.headers[key])
				})

				// Cors Stuff
				if (options.cors) {
					res.setHeader('Access-Control-Allow-Headers', '*')
					res.setHeader('Access-Control-Allow-Origin', '*')
					res.setHeader('Access-Control-Request-Method', '*')
					res.setHeader('Access-Control-Allow-Methods', types.join(','))
					if (req.method === 'OPTIONS') return res.end('')
				}

				// Check if URL exists
				let params = {}
				const actualUrl = ctx.url.pathname.split('/')
				for (let urlNumber = 0; urlNumber <= ctg.routes.normal.length - 1; urlNumber++) {
					const url = ctg.routes.normal[urlNumber]

					// Get From Cache
					if (ctg.cache.routes.has(`route::${ctx.url.pathname}`)) {
						const url = ctg.cache.routes.get(`route::${ctx.url.pathname}`)

						params = url.params
						ctx.execute.route = url.route
						ctx.execute.static = (url.route.method === 'STATIC')
						ctx.execute.exists = true

						if (ctg.cache.auths.has(`auth::${ctx.url.pathname}`)) {
							ctx.authChecks = ctg.cache.auths.get(`auth::${ctx.url.pathname}`).map((authCheck) => authCheck.func)
						} else for (let authNumber = 0; authNumber <= ctg.routes.auth.length - 1; authNumber++) {
							if (!ctx.execute.route.path.startsWith(ctg.routes.auth[authNumber].path)) continue
							ctx.authChecks.push(ctg.routes.auth[authNumber].func)

							if (!ctg.cache.auths.has(`auth::${ctx.url.pathname}`)) ctg.cache.auths.set(`auth::${ctx.url.pathname}`, [])
							ctg.cache.auths.get(`auth::${ctx.url.pathname}`).push({
								path: ctg.routes.auth[authNumber].path,
								func: ctg.routes.auth[authNumber].func
							}); continue
						}

						break
					}

					// Check for Dashboard Path
					if (options.dashboard.enabled && (ctx.url.pathname === pathParser(options.dashboard.path) || ctx.url.pathname === pathParser(options.dashboard.path) + '/stats')) {
						ctx.execute.route = {
							method: 'GET',
							path: url.path,
							pathArray: url.path.split('/'),
							code: async(ctr) => await statsRoute(ctr, ctg, ctx, options, ctg.routes.normal.length),
							data: {
								addTypes: false
							}
						}; ctx.execute.static = false
						ctx.execute.exists = true
						ctx.execute.dashboard = true

						break
					}

					// Skip Common URLs
					if (url.method !== 'STATIC' && url.method !== req.method) continue
					if (url.method === 'STATIC' && req.method !== 'GET') continue
					if (url.pathArray.length !== actualUrl.length) continue
					if (ctx.execute.exists) break

					// Check for Static Paths
					if (url.path === ctx.url.pathname && url.method === req.method) {
						ctx.execute.route = url
						ctx.execute.exists = true

						if (ctg.cache.auths.has(`auth::${ctx.url.pathname}`)) {
							ctx.authChecks = ctg.cache.auths.get(`auth::${ctx.url.pathname}`).map((authCheck) => authCheck.func)
						} else for (let authNumber = 0; authNumber <= ctg.routes.auth.length - 1; authNumber++) {
							if (!ctx.execute.route.path.startsWith(ctg.routes.auth[authNumber].path)) continue
							ctx.authChecks.push(ctg.routes.auth[authNumber].func)

							if (!ctg.cache.auths.has(`auth::${ctx.url.pathname}`)) ctg.cache.auths.set(`auth::${ctx.url.pathname}`, [])
							ctg.cache.auths.get(`auth::${ctx.url.pathname}`).push({
								path: ctg.routes.auth[authNumber].path,
								func: ctg.routes.auth[authNumber].func
							}); continue
						}

						// Set Cache
						ctg.cache.routes.set(`route::${ctx.url.pathname}`, { route: url, params: {} })

						break
					}; if (url.path === ctx.url.pathname && url.method === 'STATIC') {
						ctx.execute.route = url
						ctx.execute.static = true
						ctx.execute.exists = true

						if (ctg.cache.auths.has(`auth::${ctx.url.pathname}`)) {
							ctx.authChecks = ctg.cache.auths.get(`auth::${ctx.url.pathname}`).map((authCheck) => authCheck.func)
						} else for (let authNumber = 0; authNumber <= ctg.routes.auth.length - 1; authNumber++) {
							if (!ctx.execute.route.path.startsWith(ctg.routes.auth[authNumber].path)) continue
							ctx.authChecks.push(ctg.routes.auth[authNumber].func)

							if (!ctg.cache.auths.has(`auth::${ctx.url.pathname}`)) ctg.cache.auths.set(`auth::${ctx.url.pathname}`, [])
							ctg.cache.auths.get(`auth::${ctx.url.pathname}`).push({
								path: ctg.routes.auth[authNumber].path,
								func: ctg.routes.auth[authNumber].func
							}); continue
						}

						// Set Cache
						ctg.cache.routes.set(`route::${ctx.url.pathname}`, { route: url, params: {} })

						break
					}

					// Check Parameters
					for (let partNumber = 0; partNumber <= url.pathArray.length - 1; partNumber++) {
						const urlParam = url.pathArray[partNumber]
						const reqParam = actualUrl[partNumber]

						if (!/^:.*:$/.test(urlParam) && reqParam !== urlParam) break
						else if (urlParam === reqParam) continue
						else if (/^:.*:$/.test(urlParam)) {
							params[urlParam.substring(1, urlParam.length - 1)] = reqParam
							ctx.execute.route = url
							ctx.execute.exists = true

							continue
						}; continue
					}; if (ctx.execute.exists) {
						if (ctg.cache.auths.has(`auth::${ctx.url.pathname}`)) {
							ctx.authChecks = ctg.cache.auths.get(`auth::${ctx.url.pathname}`).map((authCheck) => authCheck.func)
						} else for (let authNumber = 0; authNumber <= ctg.routes.auth.length - 1; authNumber++) {
							if (!ctx.execute.route.path.startsWith(ctg.routes.auth[authNumber].path)) continue
							ctx.authChecks.push(ctg.routes.auth[authNumber].func)

							if (!ctg.cache.auths.has(`auth::${ctx.url.pathname}`)) ctg.cache.auths.set(`auth::${ctx.url.pathname}`, [])
							ctg.cache.auths.get(`auth::${ctx.url.pathname}`).push({
								path: ctg.routes.auth[authNumber].path,
								func: ctg.routes.auth[authNumber].func
							}); continue
						}

						// Set Cache
						ctg.cache.routes.set(`route::${ctx.url.pathname}`, { route: url, params: params })
						break
					}

					continue
				}

				// Add X-Powered-By Header (if enabled)
				if (options.poweredBy) res.setHeader('X-Powered-By', 'rjweb-server')

				// Get Correct Host IP
				let hostIp: string
				if (options.proxy && req.headers['x-forwarded-for']) hostIp = req.headers['x-forwarded-for'] as string
				else hostIp = req.socket.remoteAddress

				// Turn Cookies into Object
				let cookies = {}
				if (req.headers.cookie) req.headers.cookie.split(';').forEach((cookie) => {
					const parts = cookie.split('=')
					cookies[parts.shift().trim()] = parts.join('=')
				})

				// Parse Request Body (if enabled)
				if (req.headers['content-encoding'] === 'gzip')
					ctx.body.raw = await new Promise((resolve) => zlib.gunzip(ctx.body.raw, (error, content) => { if (error) resolve(ctx.body.raw); else resolve(content) }))
				if (options.body.parse) {
					try { ctx.body.parsed = JSON.parse(ctx.body.raw.toString()) }
					catch (e) { ctx.body.parsed = ctx.body.raw.toString() }
				} else ctx.body.parsed = ctx.body.raw.toString()

				// Create ConText Response Object
				let ctr: ctr = {
					// Properties
					controller: ctg.controller,
					headers: new valueCollection(req.headers as any, decodeURIComponent),
					cookies: new valueCollection(cookies, decodeURIComponent),
					params: new valueCollection(params, decodeURIComponent),
					queries: new valueCollection(queryUrl.parse(ctx.url.query) as any, decodeURIComponent),

					// Variables
					client: {
						userAgent: req.headers['user-agent'],
						httpVersion: req.httpVersion,
						port: req.socket.remotePort,
						ip: hostIp
					}, body: ctx.body.parsed,
					url: ctx.url,

					// Raw Values
					rawServer: server,
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
					}, redirect(location, statusCode) {
						res.statusCode = statusCode ?? 302
						res.setHeader('Location', location)
						return ctr
					}, print(msg, localOptions) {
						const niceJSON = localOptions?.niceJSON ?? false
						const contentType = localOptions?.contentType ?? ''
						const returnFunctions = localOptions?.returnFunctions ?? false

						switch (typeof msg) {
							case "object":
								res.setHeader('Content-Type', 'application/json')
								if (niceJSON) ctx.content = Buffer.from(JSON.stringify(msg, undefined, 1))
								else ctx.content = Buffer.from(JSON.stringify(msg))
								break

							case "string":
								if (contentType) res.setHeader('Content-Type', contentType)
								ctx.content = Buffer.from(msg)
								break

							case "symbol":
								if (contentType) res.setHeader('Content-Type', contentType)
								ctx.content = Buffer.from(msg.toString())
								break

							case "bigint":
							case "number":
							case "boolean":
								if (contentType) res.setHeader('Content-Type', contentType)
								ctx.content = Buffer.from(String(msg))
								break

							case "function":
								ctx.waiting = true; (async() => {
									const result = await msg()
									if (typeof result !== 'function') ctr.print(result, { niceJSON, contentType })
									else if (!returnFunctions) { (ctr as any).error = new Error('Cant return functions from functions, consider using async/await'); return eventHandler('error', ctr, ctx) }
									else { ctr.print(result, { niceJSON, contentType, returnFunctions}) }
									const parsedResult = ctx.content

									ctx.content = parsedResult
									ctx.events.emit('noWaiting')
								}) (); break

							case "undefined":
								if (contentType) res.setHeader('Content-Type', contentType)
								ctx.content = Buffer.from('')
								break
						}; return ctr
					}, status(code) {
						res.statusCode = code ?? 200
						return ctr
					}, printFile(file, localOptions) {
						const addTypes = localOptions?.addTypes ?? true
						const contentType = localOptions?.contentType ?? ''
						const cache = localOptions?.cache ?? false

						// Add Content Types
						if (addTypes && !contentType) {
							if (file.endsWith('.pdf')) ctr.setHeader('Content-Type', 'application/pdf')
							if (file.endsWith('.js')) ctr.setHeader('Content-Type', 'text/javascript')
							if (file.endsWith('.html')) ctr.setHeader('Content-Type', 'text/html')
							if (file.endsWith('.css')) ctr.setHeader('Content-Type', 'text/css')
							if (file.endsWith('.csv')) ctr.setHeader('Content-Type', 'text/csv')
							if (file.endsWith('.mpeg')) ctr.setHeader('Content-Type', 'video/mpeg')
							if (file.endsWith('.mp4')) ctr.setHeader('Content-Type', 'video/mp4')
							if (file.endsWith('.webm')) ctr.setHeader('Content-Type', 'video/webm')
							if (file.endsWith('.bmp')) ctr.setHeader('Content-Type', 'image/bmp')
						} else if (contentType) res.setHeader('Content-Type', contentType)

						// Get File Content
						let stream: fs.ReadStream, errorStop = false
						if (ctr.headers.get('accept-encoding').includes(CompressMapping[options.compression])) {
							ctr.rawRes.setHeader('Content-Encoding', CompressMapping[options.compression])
							ctr.rawRes.setHeader('Vary', 'Accept-Encoding')

							// Check Cache
							ctx.continue = false
							if (ctg.cache.files.has(`file::${file}`)) {
								ctg.data.outgoing.total += (ctg.cache.files.get(`file::${file}`) as Buffer).byteLength
								ctg.data.outgoing[ctx.previousHours[4]] += (ctg.cache.files.get(`file::${file}`) as Buffer).byteLength
								ctx.content = (ctg.cache.files.get(`file::${file}`) as Buffer)
								ctx.continue = true

								return ctr
							} else if (ctg.cache.files.has(`file::${options.compression}::${file}`)) {
								ctx.compressed = true
								ctg.data.outgoing.total += (ctg.cache.files.get(`file::${options.compression}::${file}`) as Buffer).byteLength
								ctg.data.outgoing[ctx.previousHours[4]] += (ctg.cache.files.get(`file::${options.compression}::${file}`) as Buffer).byteLength
								ctx.content = (ctg.cache.files.get(`file::${options.compression}::${file}`) as Buffer)
								ctx.continue = true

								return ctr
							}

							const compression = handleCompressType(options.compression)
							try { stream = fs.createReadStream(file); ctx.waiting = true; stream.pipe(compression); compression.pipe(res) }
							catch (e) { errorStop = true; ctr.error = e; eventHandler('error', ctr, ctx) }
							if (errorStop) return

							// Collect Data
							compression.on('data', (content: Buffer) => {
								ctg.data.outgoing.total += content.byteLength
								ctg.data.outgoing[ctx.previousHours[4]] += content.byteLength

								// Write to Cache Store
								if (cache) {
									const oldData = ctg.cache.files.get(`file::${options.compression}::${file}`) ?? Buffer.from('')
									ctg.cache.files.set(`file::${options.compression}::${file}`, Buffer.concat([ oldData as Buffer, content ]))
								}
							}); compression.once('end', () => { ctx.events.emit('noWaiting'); ctx.content = Buffer.from('') })
							res.once('close', () => { stream.close(); compression.close() })
						} else {
							try { stream = fs.createReadStream(file); ctx.waiting = true; stream.pipe(res) }
							catch (e) { errorStop = true; ctr.error = e; eventHandler('error', ctr, ctx) }

							// Collect Data
							stream.on('data', (content: Buffer) => {
								ctg.data.outgoing.total += content.byteLength
								ctg.data.outgoing[ctx.previousHours[4]] += content.byteLength

								// Write to Cache Store
								if (cache) {
									const oldData = ctg.cache.files.get(`file::${options.compression}::${file}`) ?? Buffer.from('')
									ctg.cache.files.set(`file::${options.compression}::${file}`, Buffer.concat([ oldData as Buffer, content ]))
								}
							}); stream.once('end', () => { ctx.events.emit('noWaiting'); ctx.content = Buffer.from('') })
							res.once('close', () => stream.close())
						}

						return ctr
					}
				}

				// Execute Custom Run Function
				let errorStop = false
				if (!ctx.execute.dashboard) errorStop = await eventHandler('request', ctr, ctx)
				if (errorStop) return

				// Rate Limiting
				if (options.rateLimits.enabled) {
					for (const rule of options.rateLimits.list) {
						if (ctx.url.pathname.startsWith(rule.path)) {
							res.setHeader('X-RateLimit-Limit', rule.times)
							res.setHeader('X-RateLimit-Remaining', rule.times - (await options.rateLimits.functions.get(hostIp + rule.path) ?? 0))
							res.setHeader('X-RateLimit-Reset-Every', rule.timeout)

							await options.rateLimits.functions.set(hostIp + rule.path, (await options.rateLimits.functions.get(hostIp + rule.path) ?? 0) + 1)
							setTimeout(async() => { await options.rateLimits.functions.set(hostIp + rule.path, (await options.rateLimits.functions.get(hostIp + rule.path) ?? 0) - 1) }, rule.timeout)
							if (await options.rateLimits.functions.get(hostIp + rule.path) > rule.times) {
								res.statusCode = 429
								errorStop = true
								ctr.print(options.rateLimits.message)
								return handleCompression(ctr, ctx, options)
							}
						}
					}
				}

				// Execute Authorizations
				if (ctx.authChecks.length > 0) {
					let doContinue = true, runError = null
					for (let authNumber = 0; authNumber <= ctx.authChecks.length - 1; authNumber++) {
						const authCheck = ctx.authChecks[authNumber]

						await Promise.resolve(authCheck(ctr)).then(() => {
							if (!String(res.statusCode).startsWith('2')) {
								doContinue = false
							}
						}).catch((e) => {
							doContinue = false
							runError = e
						})

						if (!doContinue && runError) {
							ctr.error = runError
							errorStop = true
							eventHandler('error', ctr, ctx)
							break
						} else if (!doContinue) {
							ctr.setHeader('Content-Type', 'text/plain')
							handleCompression(ctr, ctx, options)
							break
						}
					}

					if (!doContinue) return
				}

				// Execute Page
				if (options.dashboard.enabled && !ctx.execute.dashboard) {
					ctg.requests.total++
					ctg.requests[ctx.previousHours[4]]++
				}; if (await new Promise((resolve) => {
					if (!ctx.waiting) return resolve(false)
					ctx.events.once('noWaiting', () => resolve(false))
					ctx.events.once('endRequest', () => resolve(true))
				})) return

				if (ctx.execute.exists && !errorStop) {
					if (!ctx.execute.static) {
						await Promise.resolve(ctx.execute.route.code(ctr)).catch((e) => {
							ctr.error = e
							errorStop = true
							eventHandler('error', ctr, ctx)
						})
					} else {
						// Add Content Types
						if (ctx.execute.route.data.addTypes) {
							if (ctx.execute.route.path.endsWith('.pdf')) ctr.setHeader('Content-Type', 'application/pdf')
							if (ctx.execute.route.path.endsWith('.js')) ctr.setHeader('Content-Type', 'text/javascript')
							if (ctx.execute.route.path.endsWith('.html')) ctr.setHeader('Content-Type', 'text/html')
							if (ctx.execute.route.path.endsWith('.css')) ctr.setHeader('Content-Type', 'text/css')
							if (ctx.execute.route.path.endsWith('.csv')) ctr.setHeader('Content-Type', 'text/csv')
							if (ctx.execute.route.path.endsWith('.mpeg')) ctr.setHeader('Content-Type', 'video/mpeg')
							if (ctx.execute.route.path.endsWith('.mp4')) ctr.setHeader('Content-Type', 'video/mp4')
							if (ctx.execute.route.path.endsWith('.webm')) ctr.setHeader('Content-Type', 'video/webm')
							if (ctx.execute.route.path.endsWith('.bmp')) ctr.setHeader('Content-Type', 'image/bmp')
						}

						// Read Content
						ctx.continue = false
						if (!('content' in ctx.execute.route.data)) {
							const filePath = path.resolve(ctx.execute.route.data.file)

							// Get File Content
							let stream: fs.ReadStream, errorStop = false
							if (options.compression && String(ctr.headers.get('accept-encoding')).includes(CompressMapping[options.compression])) {
								ctr.rawRes.setHeader('Content-Encoding', CompressMapping[options.compression])
								ctr.rawRes.setHeader('Vary', 'Accept-Encoding')

								const compression = handleCompressType(options.compression)
								try { stream = fs.createReadStream(filePath); ctx.waiting = true; stream.pipe(compression); compression.pipe(res) }
								catch (e) { errorStop = true; ctr.error = e; eventHandler('error', ctr, ctx) }
								if (errorStop) return

								// Write to Total Network
								compression.on('data', (content: Buffer) => {
									ctg.data.outgoing.total += content.byteLength
									ctg.data.outgoing[ctx.previousHours[4]] += content.byteLength
								}); compression.once('end', () => { ctx.events.emit('noWaiting'); ctx.content = Buffer.from('') })
								res.once('close', () => { stream.close(); compression.close() })
							} else {
								try { stream = fs.createReadStream(filePath); ctx.waiting = true; stream.pipe(res) }
								catch (e) { errorStop = true; ctr.error = e; eventHandler('error', ctr, ctx) }

								// Write to Total Network
								stream.on('data', (content: Buffer) => {
									ctg.data.outgoing.total += content.byteLength
									ctg.data.outgoing[ctx.previousHours[4]] += content.byteLength
								}); stream.once('end', () => { ctx.events.emit('noWaiting'); ctx.content = Buffer.from('') })
								res.once('close', () => stream.close())
							}
						} else {
							ctg.data.outgoing.total += ctx.execute.route.data.content.byteLength
							ctg.data.outgoing[ctx.previousHours[4]] += ctx.execute.route.data.content.byteLength

							ctx.content = ctx.execute.route.data.content
						}
					}

					// Wait for Streams
					await new Promise((resolve) => {
						if (!ctx.waiting) return resolve(true)
						ctx.events.once('noWaiting', () => resolve(false))
					}); if (ctx.content && ctx.continue) {
						ctg.data.outgoing.total += ctx.content.byteLength
						ctg.data.outgoing[ctx.previousHours[4]] += ctx.content.byteLength

						handleCompression(ctr, ctx, options)
					} else res.end()
				} else if (!errorStop) {
					eventHandler('notfound', ctr, ctx)

					// Wait for Streams
					await new Promise((resolve) => {
						if (!ctx.waiting) return resolve(true)
						ctx.events.once('noWaiting', () => resolve(false))
					}); if (ctx.content && ctx.continue) {
						ctg.data.outgoing.total += ctx.content.byteLength
						ctg.data.outgoing[ctx.previousHours[4]] += ctx.content.byteLength

						handleCompression(ctr, ctx, options)
					} else res.end()
				}
			}); if (!options.body.enabled) ctx.events.emit('startRequest')
		}) as http.Server | https.Server

		ctg.controller = new ServerController(ctg, server, options)
		return ctg.controller
	}
}