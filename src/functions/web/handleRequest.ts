import { GlobalContext, Hours, InternalContext } from "../../types/context"
import { HttpRequest, HttpResponse, us_socket_context_t } from "uWebSockets.js"
import { pathParser } from "../../classes/URLObject"
import URLObject from "../../classes/URLObject"
import { resolve as pathResolve } from "path"
import parseContent, { Returns as ParseContentReturns } from "../parseContent"
import { Task } from "../../types/internal"
import statsRoute from "../../dashboard/routes"
import { promises as fs, createReadStream } from "fs"
import handleContentType from "../handleContentType"
import handleCompressType, { CompressMapping } from "../handleCompressType"
import handleDecompressType, { DecompressMapping } from "../handleDecompressType"
import { parse as parseQuery } from "querystring"
import { HTTPRequestContext } from "../../index"
import ValueCollection from "../../classes/valueCollection"
import handleEvent from "../handleEvent"
import { Version } from "../../index"
import EventEmitter from "events"
import Status from "../../misc/statusEnum"
import Static from "../../types/static"
import { WebSocketContext } from "src/types/webSocket"
import parseStatus from "../parseStatus"

export const getPreviousHours = (): Hours[] => {
	return Array.from({ length: 7 }, (_, i) => (new Date().getHours() - (4 - i) + 24) % 24) as any
}

export default async function handleHTTPRequest(req: HttpRequest, res: HttpResponse, socket: us_socket_context_t | null, requestType: 'http' | 'upgrade', ctg: GlobalContext) {
	let ctx: InternalContext = {
		queue: [],
		scheduleQueue(type, callback) {
			ctx.queue.push({ type, function: callback })
		}, async runQueue() {
			const sortedQueue: Task[] = ctx.queue
				.filter((task) => task.type === 'context')
				.concat(ctx.queue.filter((task) => task.type === 'execution'))

			let result = null
			for (let queueIndex = 0; !!sortedQueue[queueIndex]; queueIndex++) {
				try {
					await Promise.resolve(sortedQueue[queueIndex].function())
				} catch (err: any) {
					result = err
					break
				}
			}

			return result
		}, handleError(err) {
			if (!err) return

			ctx.error = err
			ctx.execute.event = 'runtimeError'
		}, url: new URLObject(req.getUrl() + '?' + req.getQuery(), req.getMethod()),
		continueSend: true,
		executeCode: true,
		remoteAddress: Buffer.from(res.getRemoteAddressAsText()).toString(),
		error: null,
		headers: {},
		cookies: {},
		events: new EventEmitter() as any,
		isAborted: false,
		previousHours: getPreviousHours(),
		body: {
			chunks: [],
			raw: Buffer.allocUnsafe(0),
			parsed: ''
		}, execute: {
			route: null,
			file: null,
			exists: false,
			event: 'none'
		}, response: {
			headers: {},
			status: 200,
			statusMessage: undefined,
			isCompressed: false,
			content: Buffer.allocUnsafe(0)
		}
	}

	req.forEach((header, value) => {
		ctx.headers[header] = value
	})

	// Add Powered By Header (if enabled)
	if (ctg.options.poweredBy) ctx.response.headers['rjweb-server'] = Version

	ctg.requests.total++
	ctg.requests[ctx.previousHours[4]]++

	// Add Headers
	Object.keys(ctg.defaultHeaders).forEach((key) => {
		ctx.response.headers[key.toLowerCase()] = ctg.defaultHeaders[key]
	})

	// Handle Aborting Requests
	res.onAborted(() => {
		ctx.events.emit('requestAborted')
		ctx.isAborted = true
	})

	// Handle CORS Requests
	if (ctg.options.cors && requestType === 'http') {
		ctx.response.headers['access-control-allow-headers'] = '*'
		ctx.response.headers['access-control-allow-origin'] = '*'
		ctx.response.headers['access-control-request-method'] = '*'
		ctx.response.headers['access-control-allow-methods'] = '*'

		if (ctx.url.method === 'OPTIONS') {
			if (!ctx.isAborted) return res.cork(() => {
				// Write Headers
				for (const header in ctx.response.headers) {
					if (!ctx.isAborted) res.writeHeader(header, ctx.response.headers[header])
				}

				if (!ctx.isAborted) res.end()
			})
			else return
		}
	}

	/// Handle Incoming HTTP Data
	// Handle Data
	if (requestType === 'http' && ctx.url.method !== 'GET') {
		// Check for Content-Length Header
		if (!ctx.headers['content-length'] || parseInt(ctx.headers['content-length']).toString() === 'NaN') return res.cork(() => {
			// Write Status
			if (!ctx.isAborted) res.writeStatus(parseStatus(Status.LENGTH_REQUIRED))
		
			// Write Headers
			for (const header in ctx.response.headers) {
				if (!ctx.isAborted) res.writeHeader(header, ctx.response.headers[header])
			}

			if (!ctx.isAborted) res.end()
		})
		else if (Number(ctx.headers['content-length']) > (ctg.options.body.maxSize * 1e6)) {
			const result = await parseContent(ctg.options.body.message)

			if (!ctx.isAborted) return res.cork(() => {
				// Write Headers & Status
				if (!ctx.isAborted) res.writeStatus(parseStatus(Status.PAYLOAD_TOO_LARGE))
				for (const header in ctx.response.headers) {
					if (!ctx.isAborted) res.writeHeader(header, ctx.response.headers[header])
				}
	
				if (!ctx.isAborted) res.end(result.content)
			})
		}

		// Create Decompressor
		const deCompression = handleDecompressType(DecompressMapping[ctx.headers['content-encoding']])

		let totalBytes = 0
		deCompression.on('data', async(data: Buffer) => {
			ctx.body.chunks.push(data)
		}).once('error', () => {
			deCompression.destroy()
			if (!ctx.isAborted) return res.cork(() => {
				// Write Headers & Status
				if (!ctx.isAborted) res.writeStatus(parseStatus(Status.BAD_REQUEST))
				for (const header in ctx.response.headers) {
					if (!ctx.isAborted) res.writeHeader(header, ctx.response.headers[header])
				}

				if (!ctx.isAborted) res.end('Invalid Content-Encoding Header or Content')
			})
		}).once('close', () => {
			ctx.events.emit('startRequest')
		})

		// Recieve Data
		if (!ctx.isAborted) res.onData(async(rawChunk, isLast) => {
			try {
				const buffer = Buffer.from(rawChunk), sendBuffer = Buffer.allocUnsafe(buffer.byteLength)
				buffer.copy(sendBuffer)

				totalBytes += sendBuffer.byteLength
				deCompression.write(sendBuffer)

				ctg.data.incoming.total += sendBuffer.byteLength
				ctg.data.incoming[ctx.previousHours[4]] += sendBuffer.byteLength

				if (totalBytes > (ctg.options.body.maxSize * 1e6)) {
					const result = await parseContent(ctg.options.body.message)
					deCompression.destroy()
	
					if (!ctx.isAborted) return res.cork(() => {
						// Write Headers & Status
						if (!ctx.isAborted) res.writeStatus(parseStatus(Status.PAYLOAD_TOO_LARGE))
						for (const header in ctx.response.headers) {
							if (!ctx.isAborted) res.writeHeader(header, ctx.response.headers[header])
						}
	
						if (!ctx.isAborted) res.end(result.content)
					})
					else return
				} else if (totalBytes > Number(ctx.headers['content-length'])) {
					deCompression.destroy()

					if (!ctx.isAborted) return res.cork(() => {
						// Write Headers & Status
						if (!ctx.isAborted) res.writeStatus(parseStatus(Status.BAD_REQUEST))
						for (const header in ctx.response.headers) {
							if (!ctx.isAborted) res.writeHeader(header, ctx.response.headers[header])
						}
	
						if (!ctx.isAborted) res.end('Invalid Content-Length Header')
					})
				}

				if (isLast) deCompression.end()
			} catch { }
		})
	}


	// Handle Response Data
	ctx.events.once('startRequest', async() => {
		/// Check if URL exists
		let params: Record<string, string> = {}
		const actualUrl = ctx.url.path.split('/')

		if (requestType === 'http') {
			// Check Static Paths
			const foundStatic = (file: string, url: Static) => {
				ctx.execute.file = file
				ctx.execute.route = url
				ctx.execute.exists = true

				// Set Cache
				ctg.cache.routes.set(`route::static::${ctx.url.path}`, { route: url, file })
			}; if (ctx.url.method === 'GET') for (let staticNumber = 0; staticNumber < ctg.routes.static.length; staticNumber++) {
				if (ctx.execute.exists) break

				const url = ctg.routes.static[staticNumber]

				// Get From Cache
				if (ctg.cache.routes.has(`route::static::${ctx.url.path}`)) {
					const url = ctg.cache.routes.get(`route::static::${ctx.url.path}`)

					ctx.execute.file = url.file!
					ctx.execute.route = url.route!
					ctx.execute.exists = true

					break
				}

				// Skip if not related
				if (!ctx.url.path.startsWith(url.path)) continue

				// Find File
				const urlPath = pathParser(ctx.url.path.replace(url.path, '')).substring(1)

				const fileExists = async(location: string) => {
					location = pathResolve(location)

					try {
						const res = await fs.stat(location)
						return res.isFile()
					} catch {
						return false
					}
				}

				if (url.data.hideHTML) {
					if (await fileExists(url.location + '/' + urlPath + '/index.html')) foundStatic(pathResolve(url.location + '/' + urlPath + '/index.html'), url)
					else if (await fileExists(url.location + '/' + urlPath + '.html')) foundStatic(pathResolve(url.location + '/' + urlPath + '.html'), url)
					else if (await fileExists(url.location + '/' + urlPath)) foundStatic(pathResolve(url.location + '/' + urlPath), url)
				} else if (await fileExists(url.location + '/' + urlPath)) foundStatic(pathResolve(url.location + '/' + urlPath), url)
			}

			// Check Dashboard Path
			if (ctg.options.dashboard.enabled && ctx.url.path === pathParser(ctg.options.dashboard.path)) {
				ctx.execute.route = {
					type: 'route',
					method: 'GET',
					path: ctx.url.path,
					pathArray: ctx.url.path.split('/'),
					code: async(ctr) => await statsRoute(ctr, ctg, ctx, 'http'),
					data: {
						validations: []
					}
				}

				ctx.execute.exists = true
			}

			// Check Other Paths
			if (!ctx.execute.exists) for (let urlNumber = 0; urlNumber < ctg.routes.normal.length; urlNumber++) {
				if (ctx.execute.exists) break

				const url = ctg.routes.normal[urlNumber]

				// Get From Cache
				if (ctg.cache.routes.has(`route::normal::${ctx.url.path}::${ctx.url.method}`)) {
					const url = ctg.cache.routes.get(`route::normal::${ctx.url.path}::${ctx.url.method}`)

					params = url.params!
					ctx.execute.route = url.route
					ctx.execute.exists = true

					break
				}

				// Skip if not related
				if (url.method !== ctx.url.method) continue
				if (url.pathArray.length !== actualUrl.length) continue

				// Check for Static Paths
				if (url.path === ctx.url.path && url.method === ctx.url.method) {
					ctx.execute.route = url
					ctx.execute.exists = true

					// Set Cache
					ctg.cache.routes.set(`route::normal::${ctx.url.path}::${ctx.url.method}`, { route: url, params: {} })

					break
				}

				// Check Parameters
				for (let partNumber = 0; partNumber < url.pathArray.length; partNumber++) {
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
					ctg.cache.routes.set(`route::normal::${ctx.url.path}::${ctx.url.method}`, { route: url, params: params })

					break
				}

				continue
			}
		} else {
			// Check Dashboard Path
			if (ctg.options.dashboard.enabled && ctx.url.path === pathParser(ctg.options.dashboard.path) + '/ws') {
				ctx.execute.route = {
					type: 'websocket',
					path: ctx.url.path,
					pathArray: ctx.url.path.split('/'),
					onConnect: async(ctr) => await statsRoute(ctr, ctg, ctx, 'socket'),
					data: {
						validations: []
					}
				}

				ctx.execute.exists = true
			}

			// Check Websocket Paths
			if (!ctx.execute.exists) for (let urlNumber = 0; urlNumber < ctg.routes.websocket.length; urlNumber++) {
				if (ctx.execute.exists) break

				const url = ctg.routes.websocket[urlNumber]

				// Get From Cache
				if (ctg.cache.routes.has(`route::ws::${ctx.url.path}`)) {
					const url = ctg.cache.routes.get(`route::ws::${ctx.url.path}`)

					params = url.params!
					ctx.execute.route = url.route
					ctx.execute.exists = true

					break
				}

				// Skip if not related
				if (url.pathArray.length !== actualUrl.length) continue

				// Check for Static Paths
				if (url.path === ctx.url.path) {
					ctx.execute.route = url
					ctx.execute.exists = true

					// Set Cache
					ctg.cache.routes.set(`route::ws::${ctx.url.path}`, { route: url, params: {} })

					break
				}

				// Check Parameters
				for (let partNumber = 0; partNumber < url.pathArray.length; partNumber++) {
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
					ctg.cache.routes.set(`route::ws::${ctx.url.path}`, { route: url, params: params })

					break
				}

				continue
			}
		}

		// Get Correct Host IP
		let hostIp: string
		if (ctg.options.proxy && ctx.headers['x-forwarded-for']) hostIp = ctx.headers['x-forwarded-for'].split(',')[0].trim()
		else hostIp = ctx.remoteAddress.split(':')[0]

		// Turn Cookies into Object
		if (ctx.headers['cookie']) ctx.headers['cookie'].split(';').forEach((cookie) => {
			const parts = cookie.split('=')
			if (parts.length < 2) return

			ctx.cookies[parts.shift()!.trim()] = parts.join('=')
		})

		// Create Context Response Object
		let ctr: HTTPRequestContext = {
			type: requestType,

			// Properties
			controller: ctg.controller,
			headers: new ValueCollection(ctx.headers, decodeURIComponent) as any,
			cookies: new ValueCollection(ctx.cookies, decodeURIComponent),
			params: new ValueCollection(params, decodeURIComponent),
			queries: new ValueCollection(parseQuery(ctx.url.query as any) as any),
			hashes: new ValueCollection(parseQuery(ctx.url.hash as any) as any),

			// Variables
			client: {
				userAgent: ctx.headers['user-agent'],
				port: Number(ctx.remoteAddress.split(':')[1]),
				ip: hostIp
			}, get body() {
				if (!ctx.body.raw.byteLength) {
					ctx.body.raw = Buffer.concat(ctx.body.chunks)
					ctx.body.chunks.length = 0
				}

				if (!ctx.body.parsed) {
					const stringified = ctx.body.raw.toString()
					if (ctg.options.body.parse && ctx.headers['content-type'] === 'application/json') {
						try { ctx.body.parsed = JSON.parse(stringified) }
						catch { ctx.body.parsed = stringified }
					} else ctx.body.parsed = stringified
				}

				return ctx.body.parsed
			}, get rawBody() {
				if (!ctx.body.raw.byteLength) {
					ctx.body.raw = Buffer.concat(ctx.body.chunks)
					ctx.body.chunks.length = 0
				}

				return ctx.body.raw.toString()
			},

			url: ctx.url,
			domain: ctx.headers['host'],

			// Raw Values
			rawReq: req,
			rawRes: res,

			// Custom Variables
			'@': {},

			// Functions
			setHeader(name, value) {
				ctx.response.headers[name.toLowerCase()] = Buffer.allocUnsafe(0)

				ctx.scheduleQueue('context', async() => {
					let result: ParseContentReturns
					try {
						result = await parseContent(value)
					} catch (err: any) {
						return ctx.handleError(err)
					}

					ctx.response.headers[name.toLowerCase()] = result.content
				})

				return ctr
			}, setCustom(name, value) {
				ctr['@'][name] = value

				return ctr
			}, status(code, message) {
				ctx.response.status = code ?? Status.OK
				ctx.response.statusMessage = message

				return ctr
			}, redirect(location, statusCode) {
				ctr.status(statusCode ?? Status.FOUND)

				ctx.response.headers['location'] = Buffer.from(location)

				return ctr
			}, print(content, options = {}) {
				const contentType = options?.contentType ?? ''

				ctx.scheduleQueue('execution', (async() => {
					let result: ParseContentReturns
					try {
						result = await parseContent(content)
					} catch (err: any) {
						return ctx.handleError(err)
					}

					for (const header in result.headers) {
						ctx.response.headers[header.toLowerCase()] = result.headers[header]
					}; if (contentType) ctx.response.headers['content-type'] = Buffer.from(contentType)

					ctx.response.content = result.content
				}))

				return ctr
			}, printFile(file, options = {}) {
				const addTypes = options?.addTypes ?? true
				const cache = options?.cache ?? false

				// Add Headers
				if (addTypes) ctx.response.headers['content-type'] = Buffer.from(handleContentType(file, ctg))
				if (ctr.headers.get('accept-encoding', '').includes(CompressMapping[ctg.options.compression].toString())) {
					ctx.response.headers['content-encoding'] = CompressMapping[ctg.options.compression]
					ctx.response.headers['vary'] = Buffer.from('Accept-Encoding')
				}

				ctx.scheduleQueue('execution', () => new Promise<void>((resolve) => {
					if (!ctx.isAborted) res.cork(() => {
						// Write Headers & Status
						if (!ctx.isAborted) res.writeStatus(parseStatus(ctx.response.status))
						for (const header in ctx.response.headers) {
							if (!ctx.isAborted) res.writeHeader(header, ctx.response.headers[header])
						}

						// Check Cache
						if (ctg.cache.files.has(`file::${file}`)) {
							ctg.data.outgoing.total += (ctg.cache.files.get(`file::${file}`) as Buffer).byteLength
							ctg.data.outgoing[ctx.previousHours[4]] += (ctg.cache.files.get(`file::${file}`) as Buffer).byteLength
							ctx.response.content = (ctg.cache.files.get(`file::${file}`) as Buffer)

							return resolve()
						} else if (ctg.cache.files.has(`file::${ctg.options.compression}::${file}`)) {
							ctx.response.isCompressed = true
							ctg.data.outgoing.total += (ctg.cache.files.get(`file::${ctg.options.compression}::${file}`) as Buffer).byteLength
							ctg.data.outgoing[ctx.previousHours[4]] += (ctg.cache.files.get(`file::${ctg.options.compression}::${file}`) as Buffer).byteLength
							ctx.response.content = (ctg.cache.files.get(`file::${ctg.options.compression}::${file}`) as Buffer)

							return resolve()
						}

						ctx.continueSend = false

						// Get File Content
						if (ctr.headers.get('accept-encoding', '').includes(CompressMapping[ctg.options.compression].toString())) {
							const destroyStreams = () => {
								stream.destroy()
								compression.destroy()
							}

							const compression = handleCompressType(ctg.options.compression)

							// Handle Compression
							compression.on('data', (content: Buffer) => {
								ctg.data.outgoing.total += content.byteLength
								ctg.data.outgoing[ctx.previousHours[4]] += content.byteLength

								if (!ctx.isAborted) res.write(content)

								// Write to Cache Store
								if (cache) {
									const oldData = ctg.cache.files.get(`file::${ctg.options.compression}::${file}`) ?? Buffer.allocUnsafe(0)
									ctg.cache.files.set(`file::${ctg.options.compression}::${file}`, Buffer.concat([ oldData as Buffer, content ]))
								}
							}).once('close', () => {
								ctx.response.content = Buffer.allocUnsafe(0)
								ctx.events.removeListener('requestAborted', destroyStreams)
								resolve()
								if (!ctx.isAborted) res.end()
							})

							const stream = createReadStream(file)

							// Handle Errors
							stream.once('error', (error) => {
								ctx.handleError(error)
								return resolve()
							})

							// Handle Data
							stream.pipe(compression)

							// Destroy if required
							ctx.events.once('requestAborted', destroyStreams)
						} else {
							const destroyStream = () => {
								stream.destroy()
							}

							const stream = createReadStream(file)

							// Handle Errors
							stream.once('error', (error) => {
								ctx.handleError(error)
								return resolve()
							})

							// Handle Data
							stream.on('data', (content: Buffer) => {
								ctg.data.outgoing.total += content.byteLength
								ctg.data.outgoing[ctx.previousHours[4]] += content.byteLength

								if (!ctx.isAborted) res.write(content)

								// Write to Cache Store
								if (cache) {
									const oldData = ctg.cache.files.get(`file::${file}`) ?? Buffer.allocUnsafe(0)
									ctg.cache.files.set(`file::${file}`, Buffer.concat([ oldData as Buffer, content ]))
								}
							}).once('close', () => {
								ctx.response.content = Buffer.allocUnsafe(0)
								ctx.events.removeListener('requestAborted', destroyStream)
								resolve()
								if (!ctx.isAborted) res.end()
							})

							// Destroy if required
							ctx.events.once('requestAborted', destroyStream)
						}
					})
				}))

				return ctr
			}, printStream(stream, options = {}) {
				const endRequest = options?.endRequest ?? true
				const destroyAbort = options?.destroyAbort ?? true

				ctx.scheduleQueue('execution', () => new Promise<void>((resolve) => {
					ctx.continueSend = false

					if (!ctx.isAborted) res.cork(() => {
						// Write Headers & Status
						if (!ctx.isAborted) res.writeStatus(parseStatus(ctx.response.status, ctx.response.statusMessage))
						for (const header in ctx.response.headers) {
							if (!ctx.isAborted) res.writeHeader(header, ctx.response.headers[header])
						}

						const destroyStream = () => {
							stream.destroy()
						}

						const dataListener = async(data: Buffer) => {
							try {
								data = (await parseContent(data)).content
							} catch (err: any) {
								return ctx.handleError(err)
							}

							if (!ctx.isAborted) res.write(data)

							ctg.data.outgoing.total += data.byteLength
							ctg.data.outgoing[ctx.previousHours[4]] += data.byteLength
						}, closeListener = () => {
							if (destroyAbort) ctx.events.removeListener('requestAborted', destroyStream)
							if (endRequest) {
								resolve()
								if (!ctx.isAborted) res.end()
							}
						}, errorListener = (error: Error) => {
							ctx.handleError(error)
							stream
								.removeListener('data', dataListener)
								.removeListener('close', closeListener)
								.removeListener('error', errorListener)

							return resolve()
						}

						if (destroyAbort) ctx.events.once('requestAborted', destroyStream)

						stream
							.on('data', dataListener)
							.once('close', closeListener)
							.once('error', errorListener)

						ctx.events.once('requestAborted', () => stream
							.removeListener('data', dataListener)
							.removeListener('close', closeListener)
							.removeListener('error', errorListener))
					})
				}))

				return ctr
			}
		}

		// Execute Middleware
		if (ctg.middlewares.length > 0 && !ctx.error) {
			for (let middlewareIndex = 0; middlewareIndex < ctg.middlewares.length; middlewareIndex++) {
				const middleware = ctg.middlewares[middlewareIndex]
				if (!('httpEvent' in middleware.data)) continue

				try {
					await Promise.resolve(middleware.data.httpEvent!(middleware.localContext, () => ctx.executeCode = false, ctr, ctx, ctg))
					if (ctx.error) throw ctx.error
				} catch (err: any) {
					ctx.handleError(err)
					break
				}
			}
		}

		// Handle Websocket onUpgrade
		if (ctx.executeCode && requestType === 'upgrade' && ctx.execute.exists && ctx.execute.route!.type === 'websocket' && 'onUpgrade' in ctx.execute.route!) {
			try {
				await Promise.resolve(ctx.execute.route.onUpgrade!(ctr, () => ctx.executeCode = false))
			} catch (err: any) {
				ctx.handleError(err)
			}
		}

		// Execute Custom Run Function
		if (requestType === 'http') await handleEvent('httpRequest', ctr, ctx, ctg)
		else await handleEvent('wsRequest', ctr, ctx, ctg)

		// Execute Validations
		if (ctx.execute.exists && ctx.execute.route!.data.validations.length > 0 && !ctx.error) {
			for (let validateIndex = 0; validateIndex < ctx.execute.route!.data.validations.length; validateIndex++) {
				const validate = ctx.execute.route!.data.validations[validateIndex]

				try {
					await Promise.resolve(validate(ctr))
					if (!String(ctx.response.status).startsWith('2')) ctx.executeCode = false
				} catch (err: any) {
					ctx.error = err
					ctx.execute.event = 'runtimeError'
				}
			}
		}

		// Execute Page Logic
		const runPageLogic = (eventOnly?: boolean) => new Promise<void | boolean>(async(resolve) => {
			// Execute Event
			if (!ctx.execute.exists || !ctx.execute.route) ctx.execute.event = 'http404'
			if (ctx.execute.event !== 'none') {
				await handleEvent(ctx.execute.event, ctr, ctx, ctg)
				return resolve()
			}; if (eventOnly) return resolve()
			if (!ctx.execute.route) return

			// Execute WebSocket Route
			if (ctx.execute.route.type === 'websocket' && ctx.executeCode) {
				try {
					ctx.continueSend = false
          ctg.webSockets.opened.total++
	        ctg.webSockets.opened[ctx.previousHours[4]]++

					resolve(true)

          if (!ctx.isAborted) return res.cork(() => {
            if (!ctx.isAborted) return res.upgrade(
              { ctx, params, custom: ctr["@"] } satisfies WebSocketContext,
              ctx.headers['sec-websocket-key'],
              ctx.headers['sec-websocket-protocol'],
              ctx.headers['sec-websocket-extensions'],
              socket!
            )
          })
				} catch (err: any) {
					ctx.error = err
					ctx.execute.event = 'runtimeError'
					await runPageLogic()
				}

				return resolve()
			}

			// Execute Static Route
			if (ctx.execute.route.type === 'static') {
				ctr.printFile(ctx.execute.file!)
				return resolve()
			}

			// Execute Normal Route
			if (ctx.execute.route.type === 'route' && ctx.executeCode) {
				try {
					await Promise.resolve(ctx.execute.route.code(ctr))
				} catch (err: any) {
					ctx.error = err
					ctx.execute.event = 'runtimeError'
					await runPageLogic()
				}

				return resolve()
			}

			return resolve()
		})

		if (await runPageLogic()) return

		// Execute Queue
		if (ctx.queue.length > 0) {
			const err = await ctx.runQueue()

			if (err) {
				ctx.error = err
				ctx.execute.event = 'runtimeError'
			}
		}; await runPageLogic(true)


		// Handle Reponse
		try {
			if (!ctx.isAborted && ctx.continueSend) return res.cork(() => {
				// Write Status
				if (!ctx.isAborted) res.writeStatus(parseStatus(ctx.response.status, ctx.response.statusMessage))

				if (!ctx.response.isCompressed && ctr.headers.get('accept-encoding', '').includes(CompressMapping[ctg.options.compression].toString())) {
					ctx.response.headers['content-encoding'] = CompressMapping[ctg.options.compression]
					ctx.response.headers['vary'] = Buffer.from('Accept-Encoding')

					// Write Headers
					for (const header in ctx.response.headers) {
						if (!ctx.isAborted) res.writeHeader(header, ctx.response.headers[header])
					}

					const compression = handleCompressType(ctg.options.compression)
					compression.on('data', (data: Buffer) => {
						ctg.data.outgoing.total += data.byteLength
						ctg.data.outgoing[ctx.previousHours[4]] += data.byteLength
				
						if (!ctx.isAborted) res.write(data)
					}).once('close', () => {
						if (!ctx.isAborted) res.end()
					})

					compression.end(ctx.response.content)
				} else {
					ctg.data.outgoing.total += ctx.response.content.byteLength
					ctg.data.outgoing[ctx.previousHours[4]] += ctx.response.content.byteLength

					// Write Headers
					for (const header in ctx.response.headers) {
						if (!ctx.isAborted) res.writeHeader(header, ctx.response.headers[header])
					}

					if (!ctx.isAborted && ctx.response.isCompressed) res.end()
					else if (!ctx.isAborted) res.end(ctx.response.content)
				}
			})
		} catch { }
	})

	if (requestType === 'upgrade' || ctx.url.method === 'GET') ctx.events.emit('startRequest')
}