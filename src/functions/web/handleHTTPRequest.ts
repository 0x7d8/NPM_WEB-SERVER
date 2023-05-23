import { GlobalContext, LocalContext } from "../../types/context"
import { HttpRequest, HttpResponse, us_socket_context_t } from "@rjweb/uws"
import parsePath from "../parsePath"
import URLObject from "../../classes/URLObject"
import { resolve as pathResolve } from "path"
import parseContent from "../parseContent"
import { dashboardIndexRoute, dashboardWsRoute } from "./handleDashboard"
import { promises as fs } from "fs"
import handleCompressType from "../handleCompressType"
import handleDecompressType, { DecompressMapping } from "../handleDecompressType"
import MiniEventEmitter from "../../classes/miniEventEmitter"
import ValueCollection from "../../classes/valueCollection"
import handleEvent from "../handleEvent"
import { Version } from "../.."
import Status from "../../misc/statusEnum"
import { toArrayBuffer } from "../../classes/web/HttpRequest"
import Static from "../../types/static"
import { WebSocketContext } from "../../types/webSocket"
import toETag from "../toETag"
import parseStatus from "../parseStatus"
import { isRegExp } from "util/types"
import parseKV from "../parseKV"
import parseHeaders from "../parseHeaders"
import getCompressMethod from "../getCompressMethod"

const fileExists = async(location: string) => {
	location = pathResolve(location)

	try {
		const res = await fs.stat(location)
		return res.isFile()
	} catch {
		return false
	}
}

export default async function handleHTTPRequest(req: HttpRequest, res: HttpResponse, socket: us_socket_context_t | null, requestType: 'http' | 'upgrade', ctg: GlobalContext) {
	// Parse Basic Types
	const queryString = req.getQuery(),
		url = new URLObject(req.getUrl() + (queryString ? `?${queryString}` : ''), req.getMethod())

	ctg.logger.debug('HTTP Request recieved')
	ctg.requests.increase()

	const ctx: LocalContext = {
		executeSelf: () => true,
		handleError(err) {
			if (!err) return

			ctx.error = err
			ctx.execute.event = 'httpError'
		}, setExecuteSelf(callback) {
			ctx.executeSelf = callback
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
		events: new MiniEventEmitter(),
		isProxy: false,
		isAborted: false,
		refListeners: [],
		body: {
			type: 'unknown',
			chunks: [],
			raw: Buffer.allocUnsafe(0),
			parsed: ''
		}, execute: {
			route: null,
			found: false,
			file: null,
			event: 'none'
		}, response: {
			headers: { ...ctg.defaultHeaders },
			status: 200,
			statusMessage: undefined,
			isCompressed: false,
			content: Buffer.allocUnsafe(0),
			contentPrettify: false
		}
	}

	// Get Headers
	req.forEachHeader((header, value) => {
		ctx.headers.set(header, value)
	})

	// Add Default headers
	if (ctg.options.poweredBy) ctx.response.headers['rjweb-server'] = Version
	ctx.response.headers['accept-ranges'] = 'none'

	// Check Proxy
	if (ctg.options.proxy.enabled) {
		ctx.response.headers['proxy-authenticate'] = `Basic realm="Access rjweb-server@${Version}"`

		if (ctg.options.proxy.forceProxy) {
			if (!ctx.headers.has('proxy-authorization')) {
				const parsedHeaders = await parseHeaders(ctx.response.headers, ctg.logger)

				if (!ctx.isAborted) return res.cork(() => {
					// Write Status & Headers
					if (!ctx.isAborted) res.writeStatus(parseStatus(Status.PROXY_AUTHENTICATION_REQUIRED))
					for (const header in parsedHeaders) {
						if (!ctx.isAborted) res.writeHeader(header, parsedHeaders[header])
					}

					if (!ctx.isAborted) res.end('No Proxy Authentication Provided')
				})
				else return
			}
		}

		if (ctx.headers.has('proxy-authorization')) {
			if (!ctg.options.proxy.credentials.authenticate) ctx.isProxy = true
			else if (ctx.headers.get('proxy-authorization') !== 'Basic '.concat(Buffer.from(`${ctg.options.proxy.credentials.username}:${ctg.options.proxy.credentials.password}`).toString('base64'))) {
				const parsedHeaders = await parseHeaders(ctx.response.headers, ctg.logger)

				if (!ctx.isAborted) return res.cork(() => {
					// Write Status & Headers
					if (!ctx.isAborted) res.writeStatus(parseStatus(Status.PROXY_AUTHENTICATION_REQUIRED))
					for (const header in parsedHeaders) {
						if (!ctx.isAborted) res.writeHeader(header, parsedHeaders[header])
					}

					if (!ctx.isAborted) res.end('Invalid Proxy Authentication Provided')
				})
				else return
			} else ctx.isProxy = true
		}
	}

	// Check for Content-Length Header
	if (ctx.headers.has('content-length') && isNaN(parseInt(ctx.headers.get('content-length')))) {
		const parsedHeaders = await parseHeaders(ctx.response.headers, ctg.logger)

		if (!ctx.isAborted) return res.cork(() => {
			// Write Status & Headers
			if (!ctx.isAborted) res.writeStatus(parseStatus(Status.LENGTH_REQUIRED))
			for (const header in parsedHeaders) {
				if (!ctx.isAborted) res.writeHeader(header, parsedHeaders[header])
			}

			if (!ctx.isAborted) res.end()
		})
		else return
	} else if (ctx.headers.has('content-length') && parseInt(ctx.headers.get('content-length')) > ctg.options.body.maxSize) {
		const parsedHeaders = await parseHeaders(ctx.response.headers, ctg.logger)
		const result = await parseContent(ctg.options.body.message, false, ctg.logger)

		if (!ctx.isAborted) return res.cork(() => {
			// Write Headers & Status
			if (!ctx.isAborted) res.writeStatus(parseStatus(Status.PAYLOAD_TOO_LARGE))
			for (const header in parsedHeaders) {
				if (!ctx.isAborted) res.writeHeader(header, parsedHeaders[header])
			}

			if (!ctx.isAborted) res.end(result.content)
		})
		else return
	}

	// Handle Aborting Requests
	res.onAborted(() => {
		ctx.events.send('requestAborted')
		ctx.isAborted = true
	})

	// Handle CORS Requests
	if (ctg.options.cors && requestType === 'http') {
		ctx.response.headers['access-control-allow-headers'] = '*'
		ctx.response.headers['access-control-allow-origin'] = '*'
		ctx.response.headers['access-control-request-method'] = '*'
		ctx.response.headers['access-control-allow-methods'] = '*'

		if (ctx.url.method === 'OPTIONS') {
			ctg.logger.debug('OPTIONS CORS Early End Request succeeded')

			const parsedHeaders = await parseHeaders(ctx.response.headers, ctg.logger)

			if (!ctx.isAborted) return res.cork(() => {
				// Write Headers
				for (const header in parsedHeaders) {
					if (!ctx.isAborted) res.writeHeader(header, parsedHeaders[header])
				}

				if (!ctx.isAborted) res.end()
			})
			else return
		}
	}

	/// Check if URL exists
	const actualUrl = ctx.url.path.split('/')
	if (requestType === 'http') {
		// Get From Cache
		if (ctg.cache.routes.has(`route::normal::${ctx.url.path}::${ctx.url.method}`)) {
			const url = ctg.cache.routes.get(`route::normal::${ctx.url.path}::${ctx.url.method}`)!

			ctx.params = url.params!
			ctx.execute.route = url.route
			ctx.execute.found = true
		} else if (ctx.url.method === 'GET' && ctg.cache.routes.has(`route::static::${ctx.url.path}`)) {
			const url = ctg.cache.routes.get(`route::static::${ctx.url.path}`)!

			ctx.execute.file = url.file!
			ctx.execute.route = url.route!
			ctx.execute.found = true
		}

		// Check Defined Paths
		if (!ctx.execute.found) for (let urlNumber = 0; urlNumber < ctg.routes.normal.length; urlNumber++) {
			if (ctx.execute.found) break

			const url = ctg.routes.normal[urlNumber]

			// Check Regex Paths
			if (isRegExp(url.path) && 'pathStartWith' in url && ctx.url.path.startsWith(url.pathStartWith) && url.path.test(ctx.url.path)) {
				ctx.execute = {
					found: true,
					route: url,
					file: null,
					event: ctx.execute.event
				}

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
				ctx.execute = {
					found: true,
					route: url,
					file: null,
					event: ctx.execute.event
				}

				// Set Cache
				ctg.cache.routes.set(`route::normal::${ctx.url.path}::${ctx.url.method}`, { route: url, params: ctx.params })

				break
			}

			// Check Parameters
			for (let partNumber = 0; partNumber < url.pathArray.length; partNumber++) {
				const urlParam = url.pathArray[partNumber]
				const reqParam = actualUrl[partNumber]

				if (!/^<.*>$/.test(urlParam) && reqParam !== urlParam) {
					ctx.execute.found = false

					break
				} else if (urlParam === reqParam) continue
				else if (/^<.*>$/.test(urlParam)) {
					ctx.params.set(urlParam.substring(1, urlParam.length - 1), reqParam)
					ctx.execute = {
						found: true,
						route: url,
						file: null,
						event: ctx.execute.event
					}

					continue
				}; continue
			}; if (ctx.execute.found) {
				// Set Cache
				ctg.cache.routes.set(`route::normal::${ctx.url.path}::${ctx.url.method}`, { route: url, params: ctx.params })

				break
			}

			continue
		}

		if (ctx.url.method === 'GET') {
			// Check Static Paths
			const foundStatic = (file: string, url: Static) => {
				ctx.execute.found = true
				ctx.execute.route = url
				ctx.execute.file = file

				// Set Cache
				ctg.cache.routes.set(`route::static::${ctx.url.path}`, { route: url, file })
			}

			if (!ctx.execute.found) for (let staticNumber = 0; staticNumber < ctg.routes.static.length; staticNumber++) {
				if (ctx.execute.found) break

				const url = ctg.routes.static[staticNumber]

				// Skip if not related
				if (!ctx.url.path.startsWith(url.path)) continue

				// Find File
				const urlPath = parsePath(ctx.url.path.replace(url.path, '')).substring(1)
				if (url.data.hideHTML) {
					if (await fileExists(url.location + '/' + urlPath + '/index.html')) foundStatic(pathResolve(url.location + '/' + urlPath + '/index.html'), url)
					else if (await fileExists(url.location + '/' + urlPath + '.html')) foundStatic(pathResolve(url.location + '/' + urlPath + '.html'), url)
					else if (await fileExists(url.location + '/' + urlPath)) foundStatic(pathResolve(url.location + '/' + urlPath), url)
				} else if (await fileExists(url.location + '/' + urlPath)) foundStatic(pathResolve(url.location + '/' + urlPath), url)
			}

			// Check Dashboard Path
			if (ctg.options.dashboard.enabled && ctx.url.path === parsePath(ctg.options.dashboard.path)) {
				ctx.execute.route = dashboardIndexRoute(ctg, ctx)
				ctx.execute.found = true
			}

			// Check HTMLBuilder Paths
			const htmlBuilderRoute = ctg.routes.htmlBuilder.find((h) => h.path === ctx.url.path)
			if (htmlBuilderRoute) {
				ctx.execute.route = htmlBuilderRoute
				ctx.execute.found = true
			}
		}
	} else {
		// Check Dashboard Path
		if (ctg.options.dashboard.enabled && ctx.url.path === parsePath([ ctg.options.dashboard.path, '/ws' ])) {
			ctx.execute.route = dashboardWsRoute(ctg, ctx)

			ctx.execute.found = true
		}

		// Get From Cache
		if (ctg.cache.routes.has(`route::ws::${ctx.url.path}`)) {
			const url = ctg.cache.routes.get(`route::ws::${ctx.url.path}`)!

			ctx.params = url.params!
			ctx.execute.route = url.route
			ctx.execute.found = true
		}

		// Check Websocket Paths
		if (!ctx.execute.found) for (let urlNumber = 0; urlNumber < ctg.routes.websocket.length; urlNumber++) {
			if (ctx.execute.found) break

			const url = ctg.routes.websocket[urlNumber]

			// Check Regex Paths
			if (isRegExp(url.path) && 'pathStartWith' in url && ctx.url.path.startsWith(url.pathStartWith) && url.path.test(ctx.url.path)) {
				ctx.execute = {
					found: true,
					route: url,
					file: null,
					event: ctx.execute.event
				}

				// Set Cache
				ctg.cache.routes.set(`route::ws::${ctx.url.path}`, { route: url, params: ctx.params })

				break
			}

			// Skip if not related
			if (!('pathArray' in url)) continue
			if (url.pathArray.length !== actualUrl.length) continue

			// Check for Static Paths
			if (url.path === ctx.url.path) {
				ctx.execute = {
					found: true,
					route: url,
					file: null,
					event: ctx.execute.event
				}

				// Set Cache
				ctg.cache.routes.set(`route::ws::${ctx.url.path}`, { route: url, params: ctx.params })

				break
			}

			// Check Parameters
			for (let partNumber = 0; partNumber < url.pathArray.length; partNumber++) {
				const urlParam = url.pathArray[partNumber]
				const reqParam = actualUrl[partNumber]

				if (!/^<.*>$/.test(urlParam) && reqParam !== urlParam) {
					ctx.execute.found = false
					break
				} else if (urlParam === reqParam) continue
				else if (/^<.*>$/.test(urlParam)) {
					ctx.params.set(urlParam.substring(1, urlParam.length - 1), reqParam)
					ctx.execute = {
						found: true,
						route: url,
						file: null,
						event: ctx.execute.event
					}

					continue
				}; continue
			}; if (ctx.execute.found) {
				// Set Cache
				ctg.cache.routes.set(`route::ws::${ctx.url.path}`, { route: url, params: ctx.params })

				break
			}

			continue
		}
	}

	// Add Headers
	if (ctx.execute.found && ctx.execute.route?.type === 'http') {
		for (const [ key, value ] of Object.entries(ctx.execute.route.data.headers)) {
			ctx.response.headers[key] = value
		}
	}

	// Create Context Response Object
	const ctr = new ctg.classContexts.http(ctg.controller, ctx, req, res, requestType)
	if (ctx.execute.route && 'context' in ctx.execute.route) ctr["@"] = ctx.execute.route.context.keep ? ctx.execute.route.context.data : Object.assign({}, ctx.execute.route.context.data)

	// Handle Incoming Data
	if (ctx.executeCode && requestType === 'http' && ctx.url.method !== 'GET') {
		const parsedHeaders = await parseHeaders(ctx.response.headers, ctg.logger)

		// Create Decompressor
		const deCompression = handleDecompressType(ctg.options.performance.decompressBodies ? DecompressMapping[ctx.headers.get('content-encoding', 'none')] : 'none')

		let totalBytes = 0
		deCompression.on('data', async(data: Buffer) => {
			ctg.logger.debug(`processed http body chunk (${ctx.headers.get('content-encoding', 'no compression')}) with bytelen`, data.byteLength)

			ctx.body.chunks.push(data)
		}).once('error', () => {
			deCompression.destroy()
			if (!ctx.isAborted) return res.cork(() => {
				// Write Headers & Status
				if (!ctx.isAborted) res.writeStatus(parseStatus(Status.BAD_REQUEST))
				for (const header in parsedHeaders) {
					if (!ctx.isAborted) res.writeHeader(header, parsedHeaders[header])
				}

				if (!ctx.isAborted) res.end('Invalid Content-Encoding Header or Content')
			})
		}).once('close', () => {
			ctg.logger.debug('Finished http body streaming with', ctx.body.chunks.length, 'chunks')
			ctx.events.send('startRequest')
		})

		// Recieve Data
		if (!ctx.isAborted) res.onData(async(rawChunk, isLast) => {
			ctg.logger.debug('Recieved http body chunk with bytelen', rawChunk.byteLength, 'is last:', isLast)

			if (ctx.error) return
			if (!ctx.executeCode) return

			if (ctx.execute.route && 'onRawBody' in ctx.execute.route) {
				const buffer = Buffer.from(rawChunk), sendBuffer = Buffer.allocUnsafe(buffer.byteLength)
				buffer.copy(sendBuffer)

				try {
					if (!ctx.isAborted) await Promise.resolve(ctx.execute.route.onRawBody!(ctr as any, () => ctx.executeCode = false, sendBuffer, isLast))
				} catch (err) {
					ctx.handleError(err)
					ctx.events.send('startRequest')
				}

				if (isLast) deCompression.end()
			} else {
				try {
					const buffer = Buffer.from(rawChunk), sendBuffer = Buffer.allocUnsafe(buffer.byteLength)
					buffer.copy(sendBuffer)

					totalBytes += sendBuffer.byteLength
					deCompression.write(sendBuffer)

					ctg.data.incoming.increase(sendBuffer.byteLength)

					if (totalBytes > ctg.options.body.maxSize) {
						const result = await parseContent(ctg.options.body.message, false, ctg.logger)
						ctg.logger.debug('big http body request aborted')
						deCompression.destroy()
		
						if (!ctx.isAborted) return res.cork(() => {
							// Write Headers & Status
							if (!ctx.isAborted) res.writeStatus(parseStatus(Status.PAYLOAD_TOO_LARGE))
							for (const header in parsedHeaders) {
								if (!ctx.isAborted) res.writeHeader(header, parsedHeaders[header])
							}
		
							if (!ctx.isAborted) res.end(result.content)
						})
						else return
					} else if (ctx.headers.has('content-length') && totalBytes > parseInt(ctx.headers.get('content-length'))) {
						ctg.logger.debug('invalid http body request aborted')
						deCompression.destroy()

						if (!ctx.isAborted) return res.cork(() => {
							// Write Headers & Status
							if (!ctx.isAborted) res.writeStatus(parseStatus(Status.BAD_REQUEST))
							for (const header in parsedHeaders) {
								if (!ctx.isAborted) res.writeHeader(header, parsedHeaders[header])
							}
		
							if (!ctx.isAborted) res.end('Invalid Content-Length Header')
						})
						else return
					}

					if (isLast) deCompression.end()
				} catch { }
			}
		})
	}

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

	// Execute Custom run function
	await handleEvent('httpRequest', ctr, ctx, ctg)

	// Execute Validations
	if (ctx.executeCode && ctx.execute.found && ctx.execute.route!.data.validations.length > 0 && !ctx.error) {
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


	// Handle Response Data
	ctx.events.listen('startRequest', async() => {
		// Handle Websocket onUpgrade
		if (ctx.executeCode && requestType === 'upgrade' && ctx.execute.found && ctx.execute.route!.type === 'websocket' && 'onUpgrade' in ctx.execute.route!) {
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
			if (!ctx.execute.found && !didExecute404) {
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

          ctg.webSockets.opened.increase()

					resolve(true)

					// Parse Headers
					const parsedHeaders = await parseHeaders(ctx.response.headers, ctg.logger)

          if (!ctx.isAborted) return res.cork(() => {
						ctg.logger.debug('Upgraded http request to websocket')

						// Write Status & Headers
						if (!ctx.isAborted) res.writeStatus(parseStatus(Status.SWITCHING_PROTOCOLS))
						for (const header in parsedHeaders) {
							if (!ctx.isAborted) res.writeHeader(header, parsedHeaders[header])
						}

						// Upgrade Request to WebSocket
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
				ctr.printFile(ctx.execute.file!, { compress: ctx.execute.route.data.doCompress })
				return resolve()
			}

			// Execute HTTP Route
			if (ctx.execute.route.type === 'http' && ctx.executeCode) {
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

		// Execute Self Sufficient Script
		try {
			const result = await Promise.resolve(ctx.executeSelf())
			ctx.continueSend = result

			if (result) await runPageLogic(true)
		} catch (err) {
			ctx.handleError(err)
			await runPageLogic(true)
		}


		// Handle Reponse
		if (ctx.continueSend) try {
			const response = await parseContent(ctx.response.content, ctx.response.contentPrettify, ctg.logger)
			Object.assign(ctx.response.headers, response.headers)
			const [ compressMethod, compressHeader, compressWrite ] = getCompressMethod(!ctx.response.isCompressed, ctx.headers.get('accept-encoding', ''), res, response.content.byteLength, ctg)
			ctx.response.headers['content-encoding'] = compressHeader
			if (compressHeader) ctx.response.headers['vary'] = 'accept-encoding'

			const parsedHeaders = await parseHeaders(ctx.response.headers, ctg.logger)

			let eTag: string | null
			if (ctg.options.performance.eTag) {
				eTag = toETag(response.content, parsedHeaders, ctx.response.status)
				ctg.logger.debug('generated etag for content of bytelen', response.content.byteLength)
				if (eTag) parsedHeaders['etag'] = Buffer.from(`W/"${eTag}"`)
			}

			if (!ctx.isAborted) return res.cork(() => {
				let endEarly = false
				if (ctg.options.performance.eTag && eTag && ctx.headers.get('if-none-match') === `W/"${eTag}"`) {
					ctg.logger.debug('ended etag request early because of match')

					ctx.response.status = Status.NOT_MODIFIED
					ctx.response.statusMessage = undefined
					endEarly = true
				}

				// Write Headers & Status
				if (!ctx.isAborted) res.writeStatus(parseStatus(ctx.response.status))
				for (const header in parsedHeaders) {
					if (!ctx.isAborted) res.writeHeader(header, parsedHeaders[header])
				}

				if (endEarly) {
					if (!ctx.isAborted) res.end()
					return
				}

				// Get Content
				if (compressHeader) ctg.logger.debug('negotiated to use', compressHeader)
				const compression = handleCompressType(compressMethod)
				const destroyStream = () => {
					compression.destroy()
				}

				// Handle Compression
				compression.on('data', (content: Buffer) => {
					res.content = toArrayBuffer(content)

					if (!ctx.isAborted) {
						try {
							res.contentOffset = res.getWriteOffset()
							const ok = compressWrite(res.content)

							if (!ok) {
								//compression.pause()

								res.onWritable((offset) => {
									const sliced = res.content.slice(offset - res.contentOffset)

									const ok = compressWrite(sliced)
									if (ok) {
										ctg.data.outgoing.increase(sliced.byteLength)
										ctg.logger.debug('sent http body chunk with bytelen', sliced.byteLength)
										//compression.resume()
									}

									return ok
								})
							} else {
								ctg.data.outgoing.increase(content.byteLength)
								ctg.logger.debug('sent http body chunk with bytelen', content.byteLength)
							}
						} catch { }
					}
				}).once('end', () => {
					if (compressHeader && !ctx.isAborted) res.end()
					destroyStream()

					ctx.events.unlist('requestAborted', destroyStream)
					return
				})

				// Handle Data
				compression.end(response.content)

				// Destroy if required
				ctx.events.listen('requestAborted', destroyStream)
			})
		} catch (err) {
			ctg.logger.debug(`Ending Request ${ctr.url.href} discarded unknown:`, err)
		}
	})

	if (!ctx.executeCode || requestType === 'upgrade' || ctx.url.method === 'GET') ctx.events.send('startRequest')
}