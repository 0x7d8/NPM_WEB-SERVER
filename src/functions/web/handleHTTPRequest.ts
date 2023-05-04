import { GlobalContext, Hours, LocalContext } from "../../types/context"
import { HttpRequest, HttpResponse, us_socket_context_t } from "@rjweb/uws"
import parsePath from "../parsePath"
import URLObject from "../../classes/URLObject"
import { resolve as pathResolve } from "path"
import parseContent from "../parseContent"
import { Task } from "../../types/internal"
import statsRoute from "../../dashboard/routes"
import { promises as fs } from "fs"
import handleCompressType, { CompressMapping } from "../handleCompressType"
import handleDecompressType, { DecompressMapping } from "../handleDecompressType"
import ValueCollection from "../../classes/valueCollection"
import handleEvent from "../handleEvent"
import { Version } from "../../index"
import EventEmitter from "events"
import Status from "../../misc/statusEnum"
import Static from "../../types/static"
import { WebSocketContext } from "../../types/webSocket"
import toETag from "../toETag"
import parseStatus from "../parseStatus"
import { isRegExp } from "util/types"
import parseKV from "../parseKV"

export const getPreviousHours = (): Hours[] => {
	return Array.from({ length: 7 }, (_, i) => (new Date().getHours() - (4 - i) + 24) % 24) as any
}

export default async function handleHTTPRequest(req: HttpRequest, res: HttpResponse, socket: us_socket_context_t | null, requestType: 'http' | 'upgrade', ctg: GlobalContext) {
	const url = new URLObject(req.getUrl() + '?' + req.getQuery(), req.getMethod())

	const ctx: LocalContext = {
		queue: [],
		scheduleQueue(type, callback) {
			ctx.queue.push({ type, function: callback })
		}, async runQueue() {
			const sortedQueue: Task[] = ctx.queue
				.filter((task) => task.type === 'context')
				.concat(ctx.queue.filter((task) => task.type === 'execution'))

			let result: any = null
			for (let queueIndex = 0; !!sortedQueue[queueIndex]; queueIndex++) {
				try {
					await Promise.resolve(sortedQueue[queueIndex].function())
				} catch (err) {
					result = err
					break
				}
			}

			return result
		}, handleError(err) {
			if (!err) return

			ctx.error = err
			ctx.execute.event = 'httpError'
		}, url,
		continueSend: true,
		executeCode: true,
		remoteAddress: Buffer.from(res.getRemoteAddressAsText()).toString(),
		error: null,
		headers: new ValueCollection(),
		cookies: parseKV(req.getHeader('cookie'), '=', ';'),
		params: new ValueCollection(),
		queries: parseKV(url.query),
		fragments: parseKV(url.fragments),
		events: new EventEmitter() as any,
		isAborted: false,
		refListeners: [],
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
			headers: { ...ctg.defaultHeaders },
			status: 200,
			statusMessage: undefined,
			isCompressed: false,
			content: Buffer.allocUnsafe(0)
		}
	}

	req.forEachHeader((header, value) => {
		ctx.headers.set(header, value)
	})

	// Add Powered By Header (if enabled)
	if (ctg.options.poweredBy) ctx.response.headers['rjweb-server'] = Version

	ctg.requests.total++
	ctg.requests[ctx.previousHours[4]]++

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

	/// Check if URL exists
	const actualUrl = ctx.url.path.split('/')

	if (requestType === 'http') {
		// Check Static Paths
		const foundStatic = (file: string, url: Static) => {
			ctx.execute.file = file
			ctx.execute.route = url
			ctx.execute.exists = true

			// Set Cache
			ctg.cache.routes.set(`route::static::${ctx.url.path}`, { route: url, file })
		}
		
		// Get From Cache
		if (ctg.cache.routes.has(`route::static::${ctx.url.path}`)) {
			const url = ctg.cache.routes.get(`route::static::${ctx.url.path}`)!

			ctx.execute.file = url.file!
			ctx.execute.route = url.route!
			ctx.execute.exists = true
		}

		if (!ctx.execute.exists && ctx.url.method === 'GET') for (let staticNumber = 0; staticNumber < ctg.routes.static.length; staticNumber++) {
			if (ctx.execute.exists) break

			const url = ctg.routes.static[staticNumber]

			// Skip if not related
			if (!ctx.url.path.startsWith(url.path)) continue

			// Find File
			const urlPath = parsePath(ctx.url.path.replace(url.path, '')).substring(1)

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
		if (ctg.options.dashboard.enabled && ctx.url.path === parsePath(ctg.options.dashboard.path)) {
			ctx.execute.route = {
				type: 'route',
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
			}

			ctx.execute.exists = true
		}

		// Check HTMLBuilder Paths
		const htmlBuilderRoute = ctg.routes.htmlBuilder.find((h) => h.path === ctx.url.path)
		if (htmlBuilderRoute) {
			ctx.execute.route = htmlBuilderRoute

			ctx.execute.exists = true
		}

		// Get From Cache
		if (ctg.cache.routes.has(`route::normal::${ctx.url.path}::${ctx.url.method}`)) {
			const url = ctg.cache.routes.get(`route::normal::${ctx.url.path}::${ctx.url.method}`)!

			ctx.params = url.params!
			ctx.execute.route = url.route
			ctx.execute.exists = true
		}

		// Check Other Paths
		if (!ctx.execute.exists) for (let urlNumber = 0; urlNumber < ctg.routes.normal.length; urlNumber++) {
			if (ctx.execute.exists) break

			const url = ctg.routes.normal[urlNumber]

			// Check Regex Paths
			if (isRegExp(url.path) && 'pathStartWith' in url && ctx.url.path.startsWith(url.pathStartWith) && url.path.test(ctx.url.path)) {
				ctx.execute.route = url
				ctx.execute.exists = true

				// Set Cache
				ctg.cache.routes.set(`route::normal::${ctx.url.path}::${ctx.url.method}`, { route: url, params: ctx.params })

				break
			}

			// Skip if not related
			if (!('pathArray' in url)) continue
			if (url.method !== ctx.url.method) continue
			if (url.pathArray.length !== actualUrl.length) continue

			// Check for Static Paths
			if (url.path === ctx.url.path && url.method === ctx.url.method) {
				ctx.execute.route = url
				ctx.execute.exists = true

				// Set Cache
				ctg.cache.routes.set(`route::normal::${ctx.url.path}::${ctx.url.method}`, { route: url, params: ctx.params })

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
					ctx.params.set(urlParam.substring(1, urlParam.length - 1), reqParam)
					ctx.execute.route = url
					ctx.execute.exists = true

					continue
				}; continue
			}; if (ctx.execute.exists) {
				// Set Cache
				ctg.cache.routes.set(`route::normal::${ctx.url.path}::${ctx.url.method}`, { route: url, params: ctx.params })

				break
			}

			continue
		}
	} else {
		// Check Dashboard Path
		if (ctg.options.dashboard.enabled && ctx.url.path === parsePath([ ctg.options.dashboard.path, '/ws' ])) {
			ctx.execute.route = {
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
			}

			ctx.execute.exists = true
		}

		// Get From Cache
		if (ctg.cache.routes.has(`route::ws::${ctx.url.path}`)) {
			const url = ctg.cache.routes.get(`route::ws::${ctx.url.path}`)!

			ctx.params = url.params!
			ctx.execute.route = url.route
			ctx.execute.exists = true
		}

		// Check Websocket Paths
		if (!ctx.execute.exists) for (let urlNumber = 0; urlNumber < ctg.routes.websocket.length; urlNumber++) {
			if (ctx.execute.exists) break

			const url = ctg.routes.websocket[urlNumber]

			// Check Regex Paths
			if (isRegExp(url.path) && 'pathStartWith' in url && ctx.url.path.startsWith(url.pathStartWith) && url.path.test(ctx.url.path)) {
				ctx.execute.route = url
				ctx.execute.exists = true

				// Set Cache
				ctg.cache.routes.set(`route::ws::${ctx.url.path}`, { route: url, params: ctx.params })

				break
			}

			// Skip if not related
			if (!('pathArray' in url)) continue
			if (url.pathArray.length !== actualUrl.length) continue

			// Check for Static Paths
			if (url.path === ctx.url.path) {
				ctx.execute.route = url
				ctx.execute.exists = true

				// Set Cache
				ctg.cache.routes.set(`route::ws::${ctx.url.path}`, { route: url, params: ctx.params })

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
					ctx.params.set(urlParam.substring(1, urlParam.length - 1), reqParam)
					ctx.execute.route = url
					ctx.execute.exists = true

					continue
				}; continue
			}; if (ctx.execute.exists) {
				// Set Cache
				ctg.cache.routes.set(`route::ws::${ctx.url.path}`, { route: url, params: ctx.params })

				break
			}

			continue
		}
	}

	// Add Headers
	if (ctx.execute.exists && ctx.execute.route?.type !== 'websocket') {
		for (const [ key, value ] of Object.entries(ctx.execute.route?.data.headers!)) {
			ctx.response.headers[key] = value
		}
	}

	// Create Context Response Object
	const ctr = new ctg.classContexts.http(ctg.controller, ctx, req, res, requestType)
	if (ctx.execute.route && 'context' in ctx.execute.route) ctr["@"] = ctx.execute.route.context.keep ? ctx.execute.route.context.data : Object.assign({}, ctx.execute.route.context.data)

	// Execute Middleware
	if (ctx.executeCode && ctg.middlewares.length > 0 && !ctx.error) {
		for (let middlewareIndex = 0; middlewareIndex < ctg.middlewares.length; middlewareIndex++) {
			const middleware = ctg.middlewares[middlewareIndex]
			if (!('httpEvent' in middleware.data)) continue

			try {
				await Promise.resolve(middleware.data.httpEvent!(middleware.localContext, () => ctx.executeCode = false, ctr, ctx, ctg))
				if (ctx.error) throw ctx.error
			} catch (err) {
				ctx.handleError(err)
				break
			}
		}
	}

	// Execute Custom Run Function
	if (ctx.executeCode) await handleEvent('httpRequest', ctr, ctx, ctg)

	// Execute Validations
	if (ctx.executeCode && ctx.execute.exists && ctx.execute.route!.data.validations.length > 0 && !ctx.error) {
		for (let validateIndex = 0; validateIndex < ctx.execute.route!.data.validations.length; validateIndex++) {
			const validate = ctx.execute.route!.data.validations[validateIndex]

			try {
				await Promise.resolve(validate(ctr, () => ctx.executeCode = false))
			} catch (err) {
				ctx.handleError(err)
				break
			}
		}
	}

	/// Handle Incoming HTTP Data
	// Handle Data
	if (ctx.executeCode && requestType === 'http' && ctx.url.method !== 'GET') {
		// Check for Content-Length Header
		if (ctx.headers.has('content-length') && isNaN(parseInt(ctx.headers.get('content-length')))) return res.cork(() => {
			// Write Status
			if (!ctx.isAborted) res.writeStatus(parseStatus(Status.LENGTH_REQUIRED))
		
			// Write Headers
			for (const header in ctx.response.headers) {
				if (!ctx.isAborted) res.writeHeader(header, ctx.response.headers[header])
			}

			if (!ctx.isAborted) res.end()
		})
		else if (ctx.headers.has('content-length') && parseInt(ctx.headers.get('content-length')) > (ctg.options.body.maxSize * 1e6)) {
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
		const deCompression = handleDecompressType(ctg.options.performance.decompressBodies ? DecompressMapping[ctx.headers.get('content-encoding', 'none')] : 'none')

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
			if (ctx.error) return
			if (!ctx.executeCode) return

			if (ctx.execute.route && 'onRawBody' in ctx.execute.route) {
				const buffer = Buffer.from(rawChunk), sendBuffer = Buffer.allocUnsafe(buffer.byteLength)
				buffer.copy(sendBuffer)

				try {
					if (!ctx.isAborted) await Promise.resolve(ctx.execute.route.onRawBody!(ctr as any, () => ctx.executeCode = false, sendBuffer, isLast))
				} catch (err) {
					ctx.handleError(err)
					ctx.events.emit('startRequest')
				}

				if (isLast) ctx.events.emit('startRequest')
			} else {
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
					} else if (ctx.headers.has('content-length') && totalBytes > parseInt(ctx.headers.get('content-length'))) {
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
			}
		})
	}


	// Handle Response Data
	ctx.events.once('startRequest', async() => {
		// Handle Websocket onUpgrade
		if (ctx.executeCode && requestType === 'upgrade' && ctx.execute.exists && ctx.execute.route!.type === 'websocket' && 'onUpgrade' in ctx.execute.route!) {
			try {
				await Promise.resolve(ctx.execute.route.onUpgrade!(ctr as any, () => ctx.executeCode = false))
			} catch (err) {
				ctx.handleError(err)
			}
		}

		// Execute Page Logic
		let didExecute404 = false
		const runPageLogic = (eventOnly?: boolean) => new Promise<void | boolean>(async(resolve) => {
			// Execute Event
			if (!ctx.execute.exists && !didExecute404) {
				ctx.execute.event = 'route404'
				didExecute404 = true
			}

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
              { ctx, custom: ctr["@"] } satisfies WebSocketContext,
              ctx.headers.get('sec-websocket-key', ''),
              ctx.headers.get('sec-websocket-protocol', ''),
              ctx.headers.get('sec-websocket-extensions', ''),
              socket!
            )
          })
				} catch (err) {
					ctx.error = err
					ctx.execute.event = 'httpError'
					await runPageLogic(true)
				}

				return resolve()
			}

			// Execute Static Route
			if (ctx.execute.route.type === 'static' && ctx.executeCode) {
				ctr.printFile(ctx.execute.file!)
				return resolve()
			}

			// Execute Normal Route
			if (ctx.execute.route.type === 'route' && ctx.executeCode) {
				try {
					await Promise.resolve(ctx.execute.route.onRequest(ctr as any))
				} catch (err) {
					ctx.error = err
					ctx.execute.event = 'httpError'
					await runPageLogic(true)
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
				ctx.execute.event = 'httpError'
			}
		}; await runPageLogic(true)


		// Handle Reponse
		try {
			let eTag: string | null
			if (ctg.options.performance.eTag) {
				eTag = toETag(ctx.response.content, ctx.response.headers, ctx.response.status)
				if (eTag) ctx.response.headers['etag'] = `W/"${eTag}"`
			}

			if (!ctx.isAborted && ctx.continueSend) return res.cork(() => {
				let endEarly = false
				if (ctg.options.performance.eTag && eTag && ctx.headers.get('if-none-match') === ctx.response.headers['etag']) {
					ctx.response.status = Status.NOT_MODIFIED
					ctx.response.statusMessage = undefined
					endEarly = true
				}

				// Write Status
				if (!ctx.isAborted) res.writeStatus(parseStatus(ctx.response.status, ctx.response.statusMessage))

				if (endEarly) {
					// Write Headers
					for (const header in ctx.response.headers) {
						if (!ctx.isAborted) res.writeHeader(header, ctx.response.headers[header])
					}

					if (!ctx.isAborted) res.end()
					return
				}

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

		ctx.response.content = null as any
		ctx.body.chunks.length = 0
		ctx.body.parsed = ''
		ctx.body.raw = null as any
	})

	if (!ctx.executeCode || requestType === 'upgrade' || ctx.url.method === 'GET') ctx.events.emit('startRequest')
}