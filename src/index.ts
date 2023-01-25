import ctr from "./interfaces/ctr"
import routeList, { pathParser } from "./classes/routeList"
import serverOptions, { Options } from "./classes/serverOptions"
import valueCollection from "./classes/valueCollection"
import typesEnum from "./interfaces/methods"
import { events as eventsType } from "./interfaces/event"
import route from "./interfaces/route"
import { EventEmitter } from "stream"
import types from "./misc/methods"

import * as http from "http"
import * as https from "https"
import * as queryUrl from "querystring"
import * as zlib from "zlib"
import * as path from "path"
import * as url from "url"
import * as fs from "fs"
import * as os from "os"

type hours =
	'1' | '2' | '3' | '4' | '5' |
	'6' | '7' | '8' | '9' | '10' |
	'11' | '12' | '13' | '14' | '15' |
	'16' | '17' | '18' | '19' | '20' |
	'21' | '22' | '23' | '24'

interface GlobalContext {
	/** The Request Count */ requests: Record<hours | 'total', number>
	/** The 404 Page Display */ pageDisplay: string
	/** The Data Stats */ data: {
		/** The Incoming Data Count */ incoming: Record<hours | 'total', number>
		/** The Outgoing Data Count */ outgoing: Record<hours | 'total', number>
	}
}

interface RequestContext {
	/** The Content to Write */ content: Buffer
	/** The Event Emitter */ events: EventEmitter
	/** Whether waiting is required */ waiting: boolean
	/** Whether to Continue with execution */ continue: boolean
	/** The Execute URL Object */ execute: {
		/** The Route Object that was found */ route: route
		/** Whether the Route is Static */ static: boolean
		/** Whether the Route exists */ exists: boolean
		/** Whether the Route is the Dashboard */ dashboard: boolean
	}

	/** The Request Body */ body: {
		/** Unparsed */ raw: Buffer
		/** Parsed */ parsed: any
	}
	/** The Request URL */ url: url.UrlWithStringQuery & { method: typesEnum }
	/** Previous Hour Object */ previousHours: number[]
}

export = {
	/** The RouteList */ routeList,
	/** The ServerOptions */ serverOptions,
	/** The ValueCollection */ valueCollection,
	/** The Request Types */ types: typesEnum,

	/** Start The Webserver */
	async start(
		/** Required Options */ options: Options
	) {
		options = new serverOptions(options).getOptions()
		const { routes, events } = options.routes.list()

		const coreCount = os.cpus().length
		const cacheStore = new valueCollection<string, Buffer | Object>()
		let ctg: GlobalContext = {
			requests: {
				total: 0,
				1: 0, 2: 0, 3: 0, 4: 0,
				5: 0, 6: 0, 7: 0, 8: 0,
				9: 0, 10: 0, 11: 0, 12: 0,
				13: 0, 14: 0, 15: 0, 16: 0,
				17: 0, 18: 0, 19: 0, 20: 0,
				21: 0, 22: 0, 23: 0, 24: 0
			}, pageDisplay: '',
			data: {
				incoming: {
					total: 0,
					1: 0, 2: 0, 3: 0, 4: 0,
					5: 0, 6: 0, 7: 0, 8: 0,
					9: 0, 10: 0, 11: 0, 12: 0,
					13: 0, 14: 0, 15: 0, 16: 0,
					17: 0, 18: 0, 19: 0, 20: 0,
					21: 0, 22: 0, 23: 0, 24: 0
				}, outgoing: {
					total: 0,
					1: 0, 2: 0, 3: 0, 4: 0,
					5: 0, 6: 0, 7: 0, 8: 0,
					9: 0, 10: 0, 11: 0, 12: 0,
					13: 0, 14: 0, 15: 0, 16: 0,
					17: 0, 18: 0, 19: 0, 20: 0,
					21: 0, 22: 0, 23: 0, 24: 0
				}
			}
		}

		const compressionHandler = (ctr: ctr, ctx: RequestContext) => {
			if (options.compress && !ctr.rawRes.headersSent && ctr.headers.has('accept-encoding') && ctr.headers.get('accept-encoding').includes('gzip')) {
				ctr.rawRes.setHeader('Content-Encoding', 'gzip')
    		ctr.rawRes.setHeader('Vary', 'Accept-Encoding')

				const gZip = zlib.createGzip()
				gZip.pipe(ctr.rawRes)
				gZip.end(ctx.content, 'binary')
			} else {
				ctr.rawRes.end(ctx.content, 'binary')
			}
		}; const eventHandler = async(event: eventsType, ctr: ctr, ctx: RequestContext) => {
			switch (event) {
				case "error": {
					const event = events.find((event) => (event.event === 'error'))

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
					const event = events.find((event) => (event.event === 'request'))

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
					const event = events.find((event) => (event.event === 'notfound'))

					if (!event) {
						// Default NotFound
						let pageDisplay = ''
						if (ctg.pageDisplay) pageDisplay = ctg.pageDisplay
						else {
							for (const url of routes) {
								const type = (url.method === 'STATIC' ? 'GET' : url.method)
								pageDisplay += `[-] [${type}] ${url.path}\n`
							}; ctg.pageDisplay = pageDisplay
						}

						ctr.status(404)
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

		let httpOptions = {}
		if (!options.https.enabled) httpOptions = {}
		else httpOptions = {
			key: (await fs.promises.readFile(options.https.keyFile).catch(() => { throw new Error(`Cant access your HTTPS Key file! (${options.https.keyFile})`) })),
			cert: (await fs.promises.readFile(options.https.certFile).catch(() => { throw new Error(`Cant access your HTTPS Cert file! (${options.https.certFile})`) }))
		}

		const server = (options.https.enabled ? https as any : http as any).createServer(httpOptions, async(req: http.IncomingMessage, res: http.ServerResponse) => {
			// Create Local ConTeXt
			let ctx: RequestContext = {
				content: Buffer.from(''),
				events: new EventEmitter(),
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
			}

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
					}; return compressionHandler({ headers: new valueCollection(req.headers as any, decodeURIComponent), rawRes: res } as any, ctx)
				} else {
					ctg.data.incoming.total += ctx.body.raw.byteLength
					ctg.data.incoming[ctx.previousHours[4]] += ctx.body.raw.byteLength
				}
			}).on('end', () => { if (ctx.continue) ctx.events.emit('startRequest') })
			ctx.events.once('startRequest', async() => {
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
				for (let urlNumber = 0; urlNumber <= routes.length - 1; urlNumber++) {
					const url = routes[urlNumber]

					// Get From Cache
					if (cacheStore.has(`route::${ctx.url.pathname}`)) {
						const url = cacheStore.get(`route::${ctx.url.pathname}`) as route

						ctx.execute.route = url
						ctx.execute.static = (url.method === 'STATIC')
						ctx.execute.exists = true

						break
					}

					// Check for Dashboard Path
					if (options.dashboard.enabled && (ctx.url.pathname === pathParser(options.dashboard.path) || ctx.url.pathname === pathParser(options.dashboard.path) + '/stats')) {
						ctx.execute.route = {
							method: 'GET',
							path: url.path,
							pathArray: url.path.split('/'),
							code: async(ctr) => {
								if (!ctr.url.path.endsWith('/stats')) {
									const dashboard = (await fs.promises.readFile(`${__dirname}/stats/index.html`, 'utf8'))
										.replaceAll('/rjweb-dashboard', pathParser(options.dashboard.path))
									return ctr.print(dashboard)
								} else {
									const date = new Date()
									const startTime = date.getTime()
									const startUsage = process.cpuUsage()

									const cpuUsage = await new Promise<number>((resolve) => setTimeout(() => {
										const currentUsage = process.cpuUsage(startUsage)
										const currentTime = new Date().getTime()
										const timeDelta = (currentTime - startTime) * 5 * coreCount
										const { user, system } = currentUsage
										resolve((system + user) / timeDelta)
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

										routes: routes.length,
										cached: cacheStore.objectCount()
									})
								}
							}, data: {
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

						// Set Cache
						cacheStore.set(`route::${ctx.url.pathname}`, url)

						break
					}; if (url.path === ctx.url.pathname && url.method === 'STATIC') {
						ctx.execute.route = url
						ctx.execute.static = true
						ctx.execute.exists = true

						// Set Cache
						cacheStore.set(`route::${ctx.url.pathname}`, url)

						break
					}

					// Check Parameters
					for (let partNumber = 0; partNumber <= url.pathArray.length - 1; partNumber++) {
						const urlParam = url.pathArray[partNumber]
						const reqParam = actualUrl[partNumber]

						if (!urlParam.startsWith(':') && reqParam !== urlParam) break
						else if (urlParam === reqParam) continue
						else if (urlParam.startsWith(':')) {
							params[urlParam.substring(1)] = reqParam
							ctx.execute.route = url
							ctx.execute.exists = true

							continue
						}; continue
					}; if (ctx.execute.exists) break
					else continue
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
					ctx.body.raw = await new Promise((resolve) => zlib.gunzip(ctx.body.raw, (_, content) => resolve(content)))
				if (options.body.parse) {
					try { JSON.parse(ctx.body.raw.toString()) }
					catch (e) { ctx.body.parsed = ctx.body.raw.toString() }
				} else ctx.body.parsed = ctx.body.raw.toString()

				// Create ConText Response Object
				let ctr: ctr = {
					// Properties
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
						res.statusCode = code
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

						// Check Cache
						if (cacheStore.has(`file::${file}`)) {
							ctg.data.outgoing.total += (cacheStore.get(`file::${file}`) as Buffer).byteLength
							ctg.data.outgoing[ctx.previousHours[4]] += (cacheStore.get(`file::${file}`) as Buffer).byteLength
							ctx.content = (cacheStore.get(`file::${file}`)) as Buffer
							return ctr
						} else if (cacheStore.has(`file::gzip::${file}`)) {
							ctg.data.outgoing.total += (cacheStore.get(`file::gzip::${file}`) as Buffer).byteLength
							ctg.data.outgoing[ctx.previousHours[4]] += (cacheStore.get(`file::gzip::${file}`) as Buffer).byteLength
							ctx.content = (cacheStore.get(`file::gzip::${file}`)) as Buffer
							return ctr
						}

						// Get File Content
						let stream: fs.ReadStream, errorStop = false
						if (options.compress && ctr.headers.has('accept-encoding') && ctr.headers.get('accept-encoding').includes('gzip')) {
							ctr.rawRes.setHeader('Content-Encoding', 'gzip')
							ctr.rawRes.setHeader('Vary', 'Accept-Encoding')

							const gZip = zlib.createGzip()
							try { stream = fs.createReadStream(file); ctx.waiting = true; stream.pipe(gZip); gZip.pipe(res) }
							catch (e) { errorStop = true; ctr.error = e; eventHandler('error', ctr, ctx) }

							// Write to Cache Store
							gZip.on('data', (content: Buffer) => {
								ctg.data.outgoing.total += content.byteLength
								ctg.data.outgoing[ctx.previousHours[4]] += content.byteLength
								const oldData = cacheStore.get(`file::gzip::${file}`) ?? Buffer.from('')
								if (cache) cacheStore.set(`file::gzip::${file}`, Buffer.concat([ oldData as Buffer, content ]))
							}); gZip.once('end', () => { ctx.events.emit('noWaiting'); ctx.content = Buffer.from('') })
							res.once('close', () => { stream.close(); gZip.close() })
						} else {
							try { stream = fs.createReadStream(file); ctx.waiting = true; stream.pipe(res) }
							catch (e) { errorStop = true; ctr.error = e; eventHandler('error', ctr, ctx) }

							// Write to Cache Store
							stream.on('data', (content: Buffer) => {
								ctg.data.outgoing.total += content.byteLength
								ctg.data.outgoing[ctx.previousHours[4]] += content.byteLength
								const oldData = cacheStore.get(`file::${file}`) ?? Buffer.from('')
								if (cache) cacheStore.set(`file::${file}`, Buffer.concat([ oldData as Buffer, content ]))
							}); stream.once('end', () => { ctx.events.emit('noWaiting'); ctx.content = Buffer.from('') })
							res.once('close', () => { stream.close() })
						}

						if (errorStop) return ctr

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
								return compressionHandler(ctr, ctx)
							}
						}
					}
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
						if (!('content' in ctx.execute.route.data)) {
							const filePath = path.resolve(ctx.execute.route.data.file)

							// Get File Content
							let stream: fs.ReadStream, errorStop = false
							if (options.compress && ctr.headers.has('accept-encoding') && ctr.headers.get('accept-encoding').includes('gzip')) {
								ctr.rawRes.setHeader('Content-Encoding', 'gzip')
								ctr.rawRes.setHeader('Vary', 'Accept-Encoding')

								const gZip = zlib.createGzip()
								try { stream = fs.createReadStream(filePath); ctx.waiting = true; stream.pipe(gZip); gZip.pipe(res) }
								catch (e) { errorStop = true; ctr.error = e; eventHandler('error', ctr, ctx) }

								// Write to Total Network
								gZip.on('data', (content: Buffer) => {
									ctg.data.outgoing.total += content.byteLength
									ctg.data.outgoing[ctx.previousHours[4]] += content.byteLength
								}); gZip.once('end', () => { ctx.events.emit('noWaiting'); ctx.content = Buffer.from('') })
								res.once('close', () => { stream.close(); gZip.close() })
							} else {
								try { stream = fs.createReadStream(filePath); ctx.waiting = true; stream.pipe(res) }
								catch (e) { errorStop = true; ctr.error = e; eventHandler('error', ctr, ctx) }

								// Write to Total Network
								stream.on('data', (content: Buffer) => {
									ctg.data.outgoing.total += content.byteLength
									ctg.data.outgoing[ctx.previousHours[4]] += content.byteLength
								}); stream.once('end', () => { ctx.events.emit('noWaiting'); ctx.content = Buffer.from('') })
								res.once('close', () => { stream.close() })
							}

							if (errorStop) return ctr
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
					}); if (ctx.content) {
						ctg.data.outgoing.total += ctx.content.byteLength
						ctg.data.outgoing[ctx.previousHours[4]] += ctx.content.byteLength

						compressionHandler(ctr, ctx)
					} else res.end()
				} else {
					eventHandler('notfound', ctr, ctx)

					// Wait for Streams
					await new Promise((resolve) => {
						if (!ctx.waiting) return resolve(true)
						ctx.events.once('noWaiting', () => resolve(false))
					}); if (ctx.content) {
						ctg.data.outgoing.total += ctx.content.byteLength
						ctg.data.outgoing[ctx.previousHours[4]] += ctx.content.byteLength

						compressionHandler(ctr, ctx)
					} else res.end()
				}
			}); if (!options.body.enabled) ctx.events.emit('startRequest')
		}) as http.Server

		server.listen(options.port, options.bind)
		return new Promise((resolve, reject) => {
			server.once('listening', () => resolve({ success: true, port: options.port, message: 'WEBSERVER STARTED', rawServer: server }))
			server.once('error', (error: Error) => { server.close(); reject({ success: false, error, message: 'WEBSERVER ERRORED' }) })
		}) as Promise<{ success: boolean, port?: number, error?: Error, message: string, rawServer?: typeof server }>
	}
}