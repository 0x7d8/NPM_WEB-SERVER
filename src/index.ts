import ctr from "./interfaces/ctr"
import routeList, { pathParser } from "./classes/routeList"
import serverOptions, { Options } from "./classes/serverOptions"
import typesEnum from "./interfaces/types"
import { events as eventsType } from "./interfaces/event"
import route from "./interfaces/route"
import { EventEmitter } from "stream"
import types from "./misc/types"

import * as path from "path"
import * as http from "http"
import * as url from "url"
import * as fs from "fs"

interface LocalContext {
	/** The Content to Write */ content: Buffer
	/** The Event Emitter */ events: EventEmitter
	/** Whether something is Streaming */ waiting: boolean
	/** The Execute URL Object */ execute: {
		/** The Route Object that was found */ route: route
		/** Whether the Route is Static */ static: boolean
		/** Whether the Route exists */ exists: boolean
	}
}

export = {
	/** The RouteList */
	routeList,

	/** The Request Types */
	types: typesEnum,

	/** Start The Webserver */
	async start(
		/** Required Options */ options: Options
	) {
		options = new serverOptions(options).getOptions()
		const { routes, events } = options.routes.list()

		const cacheMap = new Map<string, Buffer>()

		const eventHandler = async(event: eventsType, ctr: ctr) => {
			switch (event) {
				case "error": {
					const event = events.find((event) => (event.event === 'error'))

					if (!event) {
						// Default Error
						console.log(ctr.error)
						ctr.rawRes.write('An Error occurred\n')
						ctr.rawRes.write((ctr.error as Error).stack)
						ctr.status(500)
						ctr.rawRes.end()
					} else {
						// Custom Error
						Promise.resolve(event.code(ctr as any as ctr<any, true>)).catch((e) => {
							console.log(e)
							ctr.status(500)
							ctr.rawRes.write('An Error occured in your Error Event (what the hell?)\n')
							ctr.rawRes.write(e.stack)
							ctr.rawRes.end()
						}).then(() => ctr.rawRes.end())
					}
				}

				case "request": {
					let errorStop = false
					const event = events.find((event) => (event.event === 'request'))

					if (event) {
						// Custom Request
						await Promise.resolve(event.code(ctr as unknown as ctr)).catch((e) => {
							errorStop = true

							console.log(e)
							ctr.status(500)
							ctr.rawRes.write('An Error occured in your Request Event\n')
							ctr.rawRes.write(e.stack)
							ctr.rawRes.end()
						})
					}; return errorStop
				}

				case "notfound": {
					let errorStop = false
					const event = events.find((event) => (event.event === 'notfound'))

					if (!event) {
						// Default NotFound
						let pageDisplay = ''
						for (const url of routes) {
							const type = (url.method === 'STATIC' ? 'GET' : url.method)
							pageDisplay += `[-] [${type}] ${url.path}\n`
						}

						ctr.status(404)
						ctr.rawRes.write(`[!] COULDNT FIND ${ctr.url.pathname.toUpperCase()}\n[i] AVAILABLE PAGES:\n\n${pageDisplay}`)
						ctr.rawRes.end()
					} else {
						// Custom NotFound
						await Promise.resolve(event.code(ctr as unknown as ctr)).catch((e) => {
							errorStop = true

							console.log(e)
							ctr.status(500)
							ctr.rawRes.write('An Error occured in your NotFound Event\n')
							ctr.rawRes.write(e.stack)
							ctr.rawRes.end()
						}).then(() => ctr.rawRes.end())
					}; return errorStop
				}
			}
		}

		const server = http.createServer(async(req, res) => {
			let reqBody = ''

			// Get Body Size
			if (req.headers['content-length']) {
				const bodySize = Number(req.headers['content-length'])

				if (bodySize >= (options.maxBody * 1e6)) {
					res.statusCode = 413
					res.write('Payload Too Large')
					return res.end()
				}
			}

			// Save Request Body
			req.on('data', (data: string) => {
				reqBody += data
			}).on('end', async() => {
				let reqUrl = { ...url.parse(req.url), method: req.method as any }
				reqUrl.path = pathParser(reqUrl.path); reqUrl.pathname = pathParser(reqUrl.pathname)

				// Parse Request Body
				try {
					reqBody = JSON.parse(reqBody)
				} catch (e) { }

				// Cors Stuff
				if (options.cors) {
					res.setHeader('Access-Control-Allow-Headers', '*')
					res.setHeader('Access-Control-Allow-Origin', '*')
					res.setHeader('Access-Control-Request-Method', '*')
					res.setHeader('Access-Control-Allow-Methods', types.join(','))
					if (req.method === 'OPTIONS') return res.end('')
				}

				// Create Local ConTeXt
				let ctx: LocalContext = {
					content: Buffer.from(''),
					events: new EventEmitter(),
					waiting: false,
					execute: {
						route: null,
						static: false,
						exists: false
					}
				}; ctx.events.on('noWaiting', () => ctx.waiting = false)
				res.once('close', () => ctx.events.emit('endRequest'))

				// Check if URL exists
				let params = new Map()
				const actualUrl = reqUrl.pathname.split('/')
				for (let urlNumber = 0; urlNumber <= routes.length - 1; urlNumber++) {
					const url = routes[urlNumber]

					// Check for Static Paths
					if (url.path === reqUrl.pathname && url.method === req.method) {
						ctx.execute.route = routes[urlNumber]
						ctx.execute.static = false
						ctx.execute.exists = true

						break
					}; if (url.path === reqUrl.pathname && url.method === 'STATIC') {
						ctx.execute.route = routes[urlNumber]
						ctx.execute.static = true
						ctx.execute.exists = true

						break
					}

					if (url.method !== req.method) continue
					if (url.pathArray.length !== actualUrl.length) continue
					if (ctx.execute.exists) break

					// Check Parameters
					for (let partNumber = 0; partNumber <= url.pathArray.length - 1; partNumber++) {
						const urlParam = url.pathArray[partNumber]
						const reqParam = actualUrl[partNumber]

						if (!urlParam.startsWith(':') && reqParam !== urlParam) break
						if (urlParam === reqParam) continue
						else if (urlParam.startsWith(':')) {
							params.set(urlParam.replace(':', ''), decodeURIComponent(reqParam))
							ctx.execute.route = routes[urlNumber]
							ctx.execute.exists = true

							continue
						}; continue
					}; continue
				}

				// Get Correct Host IP
				let hostIp: string
				if (options.proxy && req.headers['x-forwarded-for']) hostIp = req.headers['x-forwarded-for'] as string
				else hostIp = req.socket.remoteAddress

				// Create ConText Response Object
				const headers = new Map()
				Object.keys(req.headers).forEach((header) => {
					headers.set(header, req.headers[header])
				}); headers.delete('cookie')
				const queries = new Map()
				for (const [ query, value ] of new URLSearchParams(reqUrl.search)) {
					queries.set(query, decodeURIComponent(value))
				}; const cookies = new Map()
				if (req.headers.cookie) {
					req.headers.cookie.split(';').forEach((cookie: string) => {
						let [ name, ...rest ] = cookie.split('=')
						name = name?.trim()
						if (!name) return
						const value = rest.join('=').trim()
						if (!value) return
						cookies.set(name, decodeURIComponent(value))
					})
				}

				if (options.poweredBy) res.setHeader('X-Powered-By', 'rjweb-server')
				let ctr: ctr = {
					// Properties
					headers,
					cookies,
					params,
					queries,

					// Variables
					client: {
						userAgent: req.headers['user-agent'],
						httpVersion: req.httpVersion,
						port: req.socket.remotePort,
						ip: hostIp
					}, body: reqBody,
					url: reqUrl,

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
					}, print(msg, options) {
						const niceJSON = options?.niceJSON ?? false

						switch (typeof msg) {
							case "object":
								res.setHeader('Content-Type', 'application/json')
								if (niceJSON) ctx.content = Buffer.from(JSON.stringify(msg, undefined, 1))
								else ctx.content = Buffer.from(JSON.stringify(msg))
								break

							case "string":
								ctx.content = Buffer.from(msg)
								break

							case "symbol":
								ctx.content = Buffer.from(msg.toString())
								break

							case "bigint":
							case "number":
							case "boolean":
								ctx.content = Buffer.from(String(msg))
								break

							case "function":
								ctx.waiting = true; (async() => {
									const result = await msg()
									if (typeof result !== 'function') ctr.print(result, { niceJSON })
									else { (ctr as any).error = new Error('Cant return functions from functions, consider using async/await'); return eventHandler('error', ctr) }
									const parsedResult = ctx.content

									ctx.content = parsedResult
									ctx.events.emit('noWaiting')
								}) (); break

							case "undefined":
								ctx.content = Buffer.from('')
								break
						}; return ctr
					}, status(code) {
						res.statusCode = code
						return ctr
					}, printFile(file, options) {
						const addTypes = options?.addTypes ?? true
						const cache = options?.cache ?? false

						// Add Content Types
						if (addTypes) {
							if (file.endsWith('.pdf')) ctr.setHeader('Content-Type', 'application/pdf')
							if (file.endsWith('.js')) ctr.setHeader('Content-Type', 'text/javascript')
							if (file.endsWith('.html')) ctr.setHeader('Content-Type', 'text/html')
							if (file.endsWith('.css')) ctr.setHeader('Content-Type', 'text/css')
							if (file.endsWith('.csv')) ctr.setHeader('Content-Type', 'text/csv')
							if (file.endsWith('.mpeg')) ctr.setHeader('Content-Type', 'video/mpeg')
							if (file.endsWith('.mp4')) ctr.setHeader('Content-Type', 'video/mp4')
							if (file.endsWith('.webm')) ctr.setHeader('Content-Type', 'video/webm')
							if (file.endsWith('.bmp')) ctr.setHeader('Content-Type', 'image/bmp')
						}

						// Check Cache
						if (cacheMap.has(file)) {
							ctx.content = (cacheMap.get(file))
							return ctr
						}

						// Get File Content
						let stream: fs.ReadStream, errorStop = false
						try { stream = fs.createReadStream(file); ctx.waiting = true; stream.pipe(res) }
						catch (e) { errorStop = true; ctr.error = e; eventHandler('error', ctr) }

						if (errorStop) return ctr

						// Write to Cache Map
						stream.on('data', (content: Buffer) => {
							const oldData = cacheMap.get(file) ?? Buffer.from('')
							if (cache) cacheMap.set(file, Buffer.concat([ oldData, content ]))
						}); stream.once('end', () => ctx.events.emit('noWaiting'))
						res.once('close', () => stream.close())

						return ctr
					}
				}

				// Execute Custom Run Function
				let errorStop = await eventHandler('request', ctr)
				if (errorStop) return

				// Rate Limiting
				if (options.rateLimits.enabled) {
					for (const rule of options.rateLimits.list) {
						if (reqUrl.path.startsWith(rule.path)) {
							res.setHeader('X-RateLimit-Limit', rule.times)
							res.setHeader('X-RateLimit-Remaining', rule.times - (await options.rateLimits.functions.get(hostIp + rule.path) ?? 0))
							res.setHeader('X-RateLimit-Reset-Every', rule.timeout)

							await options.rateLimits.functions.set(hostIp + rule.path, (await options.rateLimits.functions.get(hostIp + rule.path) ?? 0) + 1)
							setTimeout(async() => { await options.rateLimits.functions.set(hostIp + rule.path, (await options.rateLimits.functions.get(hostIp + rule.path) ?? 0) - 1) }, rule.timeout)
							if (await options.rateLimits.functions.get(hostIp + rule.path) > rule.times) {
								res.statusCode = 429
								errorStop = true
								ctr.print(options.rateLimits.message ?? 'Rate Limited')
								return res.end()
							}
						}
					}
				}

				// Execute Page
				if (await new Promise((resolve) => {
					if (!ctx.waiting) return resolve(false)
					ctx.events.once('noWaiting', () => resolve(false))
					ctx.events.once('endRequest', () => resolve(true))
				})) return

				if (ctx.execute.exists && !errorStop) {
					if (!ctx.execute.static) {
						await Promise.resolve(ctx.execute.route.code(ctr)).catch((e) => {
							ctr.error = e
							errorStop = true
							eventHandler('error', ctr)
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
							try { stream = fs.createReadStream(filePath); ctx.waiting = true; stream.pipe(res) }
							catch (e) { errorStop = true; ctr.error = e; eventHandler('error', ctr) }

							if (errorStop) return ctr

							stream.once('end', () => ctx.events.emit('noWaiting'))
							res.once('close', () => stream.close())
						}

						ctx.content = ctx.execute.route.data.content
					}

					// Wait for Streams
					await new Promise((resolve) => {
						if (!ctx.waiting) return resolve(true)
						ctx.events.once('noWaiting', () => resolve(false))
					}); res.end(ctx.content, 'binary')
				} else {
					eventHandler('notfound', ctr)
				}
			})
		})

		server.listen(options.port, options.bind)
		return new Promise((resolve, reject) => {
			server.once('listening', () => resolve({ success: true, port: options.port, message: 'WEBSERVER STARTED', rawServer: server }))
			server.once('error', (error) => { server.close(); reject({ success: false, error, message: 'WEBSERVER ERRORED' }) })
		}) as Promise<{ success: boolean, port?: number, error?: Error, message: string, rawServer?: typeof server }>
	}
}