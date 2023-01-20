import ctr from "./interfaces/ctr"
import routeList, { pathParser } from "./classes/routeList"
import rateLimitRule from "./interfaces/ratelimitRule"
import typesEnum from "./interfaces/types"
import { events as eventsType } from "./interfaces/event"
import types from "./misc/types"

import * as path from "path"
import * as http from "http"
import * as url from "url"
import * as fs from "fs"

interface startOptions {
	/** The Routes for the Server */ routes: routeList
	/** RateLimit Settings */ rateLimits?: {
		/**
		 * Whether Ratelimits are enabled
		 * @default false
		*/ enabled?: boolean
		/**
		 * The Message that gets sent when a ratelimit maxes out
		 * @default "Rate Limited"
		*/ message?: any
		/**
		 * The List of Ratelimit Rules
		 * @default []
		*/ list?: rateLimitRule[]
		/** The RateLimit Functions */ functions: {
			set: (key: string, value: number) => Promise<any>
			get: (key: string) => Promise<number>
		} | Map<string, number>
	}

	/**
	 * Where the Server should bind to
	 * @default "0.0.0.0"
	*/ bind?: string
	/**
	 * Whether X-Forwarded-For will be shown as hostIp
	 * @default false
	*/ proxy?: boolean
	/**
	 * Whether all cors headers are set
	 * @default false
	*/ cors?: boolean
	/**
	 * Where the Server should start at
	 * @default 2023
	*/ port?: number
	/**
	 * The Maximum Body Size in MB
	 * @default 20
	*/ maxBody?: number
	/**
	 * Add X-Powered-By Header
	 * @default true
	*/ poweredBy?: boolean
}

export = {
	/** The RouteList */
	routeList,

	/** The Request Types */
	types: typesEnum,

	/** Start The Webserver */
	async start(
		/** Required Options */ options: startOptions
	) {
		const routes = options?.routes?.list().routes ?? []
		const events = options?.routes?.list().events ?? []
		const proxy = options?.proxy ?? false
		const rateLimits = options?.rateLimits ?? { enabled: false, list: [] }
		const bind = options?.bind ?? '0.0.0.0'
		const cors = options?.cors ?? false
		const port = options?.port ?? 2023
		const body = options?.maxBody ?? 20
		const poweredBy = options?.poweredBy ?? true

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

			if (req.headers['content-length']) {
				const bodySize = Number(req.headers['content-length'])

				if (bodySize >= (body * 1e6)) {
					res.statusCode = 413
					res.write('Payload Too Large')
					return res.end()
				}
			}

			req.on('data', (data: string) => {
				reqBody += data
			}).on('end', async() => {
				let reqUrl = { ...url.parse(req.url), method: req.method as any }
				reqUrl.path = pathParser(reqUrl.path); reqUrl.pathname = pathParser(reqUrl.pathname)
				let executeUrl: number

				// Parse Request Body
				try {
					reqBody = JSON.parse(reqBody)
				} catch (e) { }

				// Cors Stuff
				if (cors) {
					res.setHeader('Access-Control-Allow-Headers', '*')
					res.setHeader('Access-Control-Allow-Origin', '*')
					res.setHeader('Access-Control-Request-Method', '*')
					res.setHeader('Access-Control-Allow-Methods', types.join(','))
					if (req.method === 'OPTIONS') return res.end('')
				}

				// Check if URL exists
				let params = new Map()
				let exists: boolean, isStatic = false
				const actualUrl = reqUrl.pathname.split('/')
				for (let urlNumber = 0; urlNumber <= routes.length - 1; urlNumber++) {
					const url = routes[urlNumber]
					console.log(url)

					// Check for Static Paths
					if (url.path === reqUrl.pathname && url.method === req.method) {
						executeUrl = urlNumber
						isStatic = false
						exists = true

						break
					}; if (url.path === reqUrl.pathname && url.method === 'STATIC') {
						executeUrl = urlNumber
						isStatic = true
						exists = true

						break
					}

					if (url.method !== req.method) continue
					if (url.pathArray.length !== actualUrl.length) continue
					if (exists) break

					for (let partNumber = 0; partNumber <= url.pathArray.length - 1; partNumber++) {
						const urlParam = url.pathArray[partNumber]
						const reqParam = actualUrl[partNumber]

						if (!urlParam.startsWith(':') && reqParam !== urlParam) break
						if (urlParam === reqParam) continue
						else if (urlParam.startsWith(':')) {
							params.set(urlParam.replace(':', ''), decodeURIComponent(reqParam))
							executeUrl = urlNumber
							exists = true

							continue
						}; continue
					}; continue
				}

				// Get Correct Host IP
				let hostIp: string
				if (proxy && req.headers['x-forwarded-for']) hostIp = req.headers['x-forwarded-for'] as string
				else hostIp = req.socket.remoteAddress

				// Create ConText Response Object
				const headers = new Map()
				Object.keys(req.headers).forEach((header) => {
					headers.set(header, req.headers[header])
				}); headers.delete('cookie')
				const queries = new Map()
				for (const [query, value] of new URLSearchParams(reqUrl.search)) {
					queries.set(query, value)
				}; const cookies = new Map()
				if (req.headers.cookie) {
					req.headers.cookie.split(';').forEach((cookie: string) => {
						let [name, ...rest] = cookie.split('=')
						name = name?.trim()
						if (!name) return
						const value = rest.join('=').trim()
						if (!value) return
						cookies.set(name, decodeURIComponent(value))
					})
				}

				if (poweredBy) res.setHeader('X-Powered-By', 'rjweb-server')
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
							case 'object':
								res.setHeader('Content-Type', 'application/json')
								if (niceJSON) res.write(JSON.stringify(msg, undefined, 1))
								else res.write(JSON.stringify(msg))
								break

							case 'bigint':
							case 'number':
							case 'boolean':
								res.write(msg.toString())
								break

							case 'function':
								res.write(msg())
								break

							case 'undefined':
								res.write('')
								break

							default:
								try {
									res.write(msg)
								} catch (e) {
									ctr.error = e
									errorStop = true
									eventHandler('error', ctr)
								}
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
							res.write(cacheMap.get(file), 'binary')
							return ctr
						}

						// Get File Content
						let content: Buffer, errorStop = false
						try { content = fs.readFileSync(file) }
						catch (e) { errorStop = true; ctr.error = e; eventHandler('error', ctr) }

						if (errorStop) return ctr
						if (cache) cacheMap.set(file, content)
						res.write(content, 'binary')
						return ctr
					}
				}

				// Execute Custom Run Function
				let errorStop = await eventHandler('request', ctr)
				if (errorStop) return

				// Rate Limiting
				if (rateLimits.enabled) {
					for (const rule of rateLimits.list) {
						if (reqUrl.path.startsWith(rule.path)) {
							res.setHeader('X-RateLimit-Limit', rule.times)
							res.setHeader('X-RateLimit-Remaining', rule.times - (await rateLimits.functions.get(hostIp + rule.path) ?? 0))
							res.setHeader('X-RateLimit-Reset-Every', rule.timeout)

							await rateLimits.functions.set(hostIp + rule.path, (await rateLimits.functions.get(hostIp + rule.path) ?? 0) + 1)
							setTimeout(async() => { await rateLimits.functions.set(hostIp + rule.path, (await rateLimits.functions.get(hostIp + rule.path) ?? 0) - 1) }, rule.timeout)
							if (await rateLimits.functions.get(hostIp + rule.path) > rule.times) {
								res.statusCode = 429
								errorStop = true
								ctr.print(rateLimits.message ?? 'Rate Limited')
								return res.end()
							}
						}
					}
				}

				// Execute Page
				if (exists && !errorStop) {
					if (!isStatic) {
						Promise.resolve(routes[executeUrl].code(ctr)).catch((e) => {
							ctr.error = e
							errorStop = true
							eventHandler('error', ctr)
						}).then(() => res.end())
					} else {
						// Add Content Types
						if (routes[executeUrl].data.addTypes) {
							if (routes[executeUrl].path.endsWith('.pdf')) ctr.setHeader('Content-Type', 'application/pdf')
							if (routes[executeUrl].path.endsWith('.js')) ctr.setHeader('Content-Type', 'text/javascript')
							if (routes[executeUrl].path.endsWith('.html')) ctr.setHeader('Content-Type', 'text/html')
							if (routes[executeUrl].path.endsWith('.css')) ctr.setHeader('Content-Type', 'text/css')
							if (routes[executeUrl].path.endsWith('.csv')) ctr.setHeader('Content-Type', 'text/csv')
							if (routes[executeUrl].path.endsWith('.mpeg')) ctr.setHeader('Content-Type', 'video/mpeg')
							if (routes[executeUrl].path.endsWith('.mp4')) ctr.setHeader('Content-Type', 'video/mp4')
							if (routes[executeUrl].path.endsWith('.webm')) ctr.setHeader('Content-Type', 'video/webm')
							if (routes[executeUrl].path.endsWith('.bmp')) ctr.setHeader('Content-Type', 'image/bmp')
						}

						// Read Content
						if (!('content' in routes[executeUrl].data)) {
							const filePath = path.resolve(routes[executeUrl].data.file)

							let content: Buffer, errorStop = false
							try { content = fs.readFileSync(filePath) }
							catch (e) { errorStop = true; ctr.error = e; eventHandler('error', ctr) }

							if (errorStop) return
							res.write(content, 'binary')
							return res.end()
						}

						res.write(routes[executeUrl].data.content, 'binary')
						return res.end()
					}
				} else {
					eventHandler('notfound', ctr)
				}
			})
		})

		server.listen(port, bind)
		return new Promise((resolve, reject) => {
			server.once('listening', () => resolve({ success: true, port, message: 'WEBSERVER STARTED', rawServer: server }))
			server.once('error', (error) => { server.close(); reject({ success: false, error, message: 'WEBSERVER ERRORED' }) })
		}) as Promise<{ success: boolean, port?: number, error?: Error, message: string, rawServer?: typeof server }>
	}
}