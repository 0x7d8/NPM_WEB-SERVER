import type RequestContext from "@/types/internal/classes/RequestContext"
import type { HttpContext } from "@/types/implementation/contexts/http"
import { type Server, version } from "@/index"
import { STATUS_CODES } from "http"
import { writeHeadersSync } from "@/functions/writeHeaders"
import { parseContentSync } from "@/functions/parseContent"
import getCompressMethod from "@/functions/getCompressMethod"
import { network } from "@rjweb/utils"
import { clientIp } from "@/classes/request/Base"
import { fileExists } from "@/functions/fileExists"
import type { UsableMiddleware } from "@/classes/Middleware"
import YieldedResponse from "@/classes/YieldedResponse"
import toArrayBuffer from "@/functions/toArrayBuffer"
import httpDate from "@/functions/httpDate"

const emptyBody = Buffer.allocUnsafe(0)

function isThenable(value: any): value is Promise<any> {
	return value !== null && typeof value === 'object' && typeof value.then === 'function'
}

/**
 * Handler for HTTP Requests
 * @since 9.0.0
*/ export default async function handle(context: RequestContext, req: HttpContext, server: Server<any, any, any>, middlewares: UsableMiddleware[], customContext: Record<string, any>) {
	const global = context.global, options = global.options
	let method = context.url.method

	if (options.version) req.header('rjweb-server', version)
	req.header('date', httpDate())

	if (method === 'TRACE' && options.methods.trace) {
		let data = `HTTP/1.1 ${context.url.href}`

		for (const [ key, value ] of context.headers) {
			data += `${key}: ${value}\r\n`
		}

		await req
			.status(200, 'OK')
			.write(toArrayBuffer(data))

		return
	}

	const internalIdentifierHeader = context.headers.get('rjweb-server-identifier')
	if (internalIdentifierHeader) {
		const internalIdentifier = parseInt(internalIdentifierHeader)

		if (!isNaN(internalIdentifier) && global.internalRequestIdentifiers.has(internalIdentifier)) {
			global.internalRequestIdentifiers.delete(internalIdentifier)

			context.ip.isInternal = true
		}
	}

	context.response.headers.set('content-type', 'text/plain')
	context.response.headers.set('accept-ranges', 'none')

	if (req.isAborted()) return context.abort()

	if (method === 'GET' || method === 'HEAD') {
		context.body.raw = emptyBody
	}

	const ctr = new global.classContexts.HttpRequest(context, server, req)
	Object.assign(ctr["@"], customContext)

	if (options.proxy.enabled) {
		context.response.headers.set('proxy-authenticate', `Basic realm="Access rjweb-server@${version}"`)

		if (options.proxy.force) {
			if (!context.headers.has('proxy-authorization')) {
				await req
					.status(ctr.$status.PROXY_AUTHENTICATION_REQUIRED, STATUS_CODES[ctr.$status.PROXY_AUTHENTICATION_REQUIRED] || 'Unknown')
					.write(global.cache.arrayBufferTexts.proxy_auth_required)

				return
			}
		}


		if (!options.proxy.credentials.authenticate) context.ip.isProxied = true
		else if (context.headers.has('proxy-authorization')) {
			let authcheck = global.cache.proxyCredentials
			if (!authcheck) {
				authcheck = Buffer.from(`${options.proxy.credentials.username}:${options.proxy.credentials.password}`).toString('base64')
				global.cache.proxyCredentials = authcheck
			}

			if (context.headers.get('proxy-authorization') !== 'Basic '.concat(authcheck)) {
				await req
					.status(ctr.$status.UNAUTHORIZED, STATUS_CODES[ctr.$status.UNAUTHORIZED] || 'Unknown')
					.write(global.cache.arrayBufferTexts.proxy_auth_invalid)

				return
			} else context.ip.isProxied = true
		}

		const oldIp = context.ip.value
		if (context.ip.isProxied) {
			context.ip.value = context.headers.get(options.proxy.header, context.ip.value).split(',')[0].trim()
		}

		if (context.ip.isProxied && options.proxy.ips.validate) {
			if (options.proxy.ips.list.some((ip) => 'equals' in ip ? ip.equals(ctr.client.ip) : ip.includes(ctr.client.ip))) {
				if (options.proxy.ips.mode === 'blacklist') {
					if (options.proxy.force) {
						await req
							.status(ctr.$status.PROXY_AUTHENTICATION_REQUIRED, STATUS_CODES[ctr.$status.PROXY_AUTHENTICATION_REQUIRED] || 'Unknown')
							.write(global.cache.arrayBufferTexts.proxy_auth_required)
		
						return
					} else {
						context.ip.isProxied = false
						context.ip.value = oldIp
						ctr.client[clientIp] = new network.IPAddress(oldIp)
					}
				}
			}
		}
	}

	for (let i = 0; i < middlewares.length; i++) {
		const middleware = middlewares[i]

		if (req.isAborted()) return context.abort()
		if (middleware.callbacks.httpRequest) {
			try {
				const result = middleware.callbacks.httpRequest(middleware.config, server, context, ctr, () => {context.endFn = true})
				if (isThenable(result)) await result
			} catch (err) {
				context.handleError(err, `http.handle.middleware.${i}.httpRequest`)
			}

			if (context.endFn) break
		}
	}

	if (global.httpHandler) {
		try {
			const result = global.httpHandler(ctr, () => {context.endFn = true})
			if (isThenable(result)) await result
		} catch (err) {
			context.handleError(err, 'http.handle.global.httpHandler')
		}

		if (req.isAborted()) return context.abort()
	}

	method = context.url.method
	const path = context.url.path
	let ranBody = false

	const headRoute = method === 'HEAD' ? context.findRoute('GET', path) : null,
		routes = global.routes[context.type],
		{ exact, dynamic, split } = global.cache.routeIndex[context.type].candidates(method, path)

	let e = 0, d = 0, exhausted = false
	while (!exhausted) {
		let i: number
		if (e < exact.length && (d >= dynamic.length || exact[e] < dynamic[d])) i = exact[e++]
		else if (d < dynamic.length) i = dynamic[d++]
		else {
			i = routes.length
			exhausted = true
		}

		const route = routes[i]
		let matched = false

		if (route) {
			const urlData = route.urlData

			if (urlData.type === 'normal' && urlData.static) matched = true
			else matched = route.matches(method, context.params, path, split!)
		}

		if (matched || (exhausted && headRoute)) {
			context.route = route ?? headRoute

			if (context.route.ratelimit && context.route.ratelimit.maxHits !== Infinity && context.route.ratelimit.timeWindow !== Infinity) {
				const ratelimitKey = `http+${ctr.client.ip.long()}-${context.route.ratelimit.sortTo}` as const

				let data = global.rateLimits.get(ratelimitKey, {
					hits: 0,
					end: Date.now() + context.route.ratelimit.timeWindow
				})
		
				if (data.hits + 1 > context.route.ratelimit.maxHits && data.end > Date.now()) {
					if (data.hits === context.route.ratelimit.maxHits) data.end += context.route.ratelimit.penalty
		
					context.endFn = true
					if (global.rateLimitHandlers.httpRequest) {
						try {
							const result = global.rateLimitHandlers.httpRequest(ctr)
							if (isThenable(result)) await result
						} catch (err) {
							context.handleError(err, 'http.handle.rateLimitHandlers.httpRequest')
						}
					} else {
						context.response.status = 429
						context.response.statusText = 'Too Many Requests'
						context.response.content = global.cache.arrayBufferTexts.rate_limit_exceeded
					}
				} else if (data.end < Date.now()) {
					global.rateLimits.delete(ratelimitKey)
		
					data = {
						hits: 0,
						end: Date.now() + context.route.ratelimit.timeWindow
					}
				}
		
				context.response.headers.set('x-ratelimit-limit', context.route.ratelimit.maxHits.toString())
				context.response.headers.set('x-ratelimit-remaining', (context.route.ratelimit.maxHits - (data.hits + 1)).toString())
				context.response.headers.set('x-ratelimit-reset', Math.floor(data.end / 1000).toString())
				context.response.headers.set('x-ratelimit-policy', `${context.route.ratelimit.maxHits};w=${Math.floor(context.route.ratelimit.timeWindow / 1000)}`)
		
				global.rateLimits.set(ratelimitKey, {
					...data,
					hits: data.hits + 1
				})
			}
		
			if (req.isAborted()) return context.abort()
		
			if (context.route && !context.endFn) {
				let yieldedNow = false

				for (let i = 0; i < context.route.validators.length; i++) {
					const validator = context.route.validators[i]

					let j = 0
					for (const validate of validator.listeners.httpRequest) {
						if (req.isAborted()) return
		
						try {
							const result = validate(ctr, () => {context.endFn = true}, validator.data)
							const response = isThenable(result) ? await result : result

							if (response instanceof YieldedResponse) {
								context.yielded = response
								yieldedNow = true
							}
						} catch (err) {
							context.handleError(err, `ws.handle.validator.${i}.listeners.${j}.httpRequest`)
						}

						j++

						if (context.endFn) break
						if (yieldedNow) {
							context.route = null
							break
						}
					}

					if (context.endFn) break
					if (!context.route) break
				}
			}
		
			if (!context.endFn && context.route) {
				if (req.isAborted()) return context.abort()

				let yieldedNow = false
				switch (context.route.type) {
					case "http": {
						if (context.route.data.onRawBody && !ranBody) {
							ranBody = true
							await context.awaitBody(ctr, false)
						}
		
						if (context.route?.data.onRequest) try {
							const result = context.route.data.onRequest(ctr)
							const response = isThenable(result) ? await result : result

							if (response instanceof YieldedResponse) {
								context.route = null
								context.yielded = response
								yieldedNow = true
							}
						} catch (err) {
							context.handleError(err, 'http.handle.onRequest')
						}
		
						break
					}
		
					case "ws": {
						if (context.route.data.onUpgrade) try {
							const result = context.route.data.onUpgrade(ctr, () => {context.endFn = true})
							const response = isThenable(result) ? await result : result

							if (response instanceof YieldedResponse) {
								context.yielded = response
								continue
							}
						} catch (err) {
							context.handleError(err, 'http.handle.onUpgrade')
						}
		
						if (!context.endFn && !context.error) {
							context.response.status = 101
							context.response.statusText = 'Switching Protocols'

							context.setExecuteSelf(async() => {
								await writeHeadersSync(null, context, req)
		
								context.body.chunks.length = 0
								context.body.raw = emptyBody
		
								const success = req
									.status(101, 'Switching Protocols')
									.upgrade({
										custom: ctr["@"],
										aborter: new AbortController(),
										context
									})
		
								if (!success) {
									context.handleError(new Error('Failed to Upgrade Connection'), 'http.handle.upgrade')
									return true
								}
		
								return false
							})
						}
		
						break
					}
				}

				if (req.isAborted()) return context.abort()
				if (yieldedNow) continue
			}

			break
		}
	}

	if (!context.endFn && !context.route && (method === 'GET' || (options.methods.head && method === 'HEAD'))) {
		const cached = global.cache.staticFiles.get(path)

		if (cached) {
			context.file = cached[0]
			context.route = cached[1]
		}

		if (!context.route) for (const route of global.routes.static) {
			if (typeof route.urlData.value !== 'string') continue
			if (!path.startsWith(route.urlData.value)) continue

			const subPath = path.slice(route.urlData.value.length)

			if (!route.data.stripHtmlEnding) {
				const file = `${route.data.folder}/${subPath}`

				if (await fileExists(file)) {
					context.file = file
					context.route = route
					global.cache.staticFiles.set(path, [file, route])

					break
				}
			} else {
				{ // path/index.html
					const file = `${route.data.folder}/${subPath}/index.html`

					if (await fileExists(file)) {
						context.file = file
						context.route = route
						global.cache.staticFiles.set(path, [file, route])

						break
					}
				}

				{ // path.html
					const file = `${route.data.folder}/${subPath}.html`

					if (await fileExists(file)) {
						context.file = file
						context.route = route
						global.cache.staticFiles.set(path, [file, route])

						break
					}
				}

				{ // path
					const file = `${route.data.folder}/${subPath}`

					if (await fileExists(file)) {
						context.file = file
						context.route = route
						global.cache.staticFiles.set(path, [file, route])

						break
					}
				}
			}
		}

		if (context.route?.type === 'static') {
			if (context.file) {
				ctr.printFile(context.file)
			} else {
				global.logger.debug(`Static Route without File: ${path}`)
			}
		}
	}

	if (!context.route && !context.endFn) {
		if (global.notFoundHandler) {
			try {
				const result = global.notFoundHandler(ctr)
				if (isThenable(result)) await result
			} catch (err) {
				context.handleError(err, 'http.handle.notFoundHandler')
			}
		} else {
			context.response.status = 404
			context.response.statusText = null
			context.response.content = global.cache.arrayBufferTexts.route_not_found
		}
	}

	if (req.isAborted()) return context.abort()

	let executeSelf: boolean | Promise<boolean> = context.error ? true : context['executeSelf']()
	if (isThenable(executeSelf)) executeSelf = await executeSelf

	if (executeSelf) {
		if (context.error) {
			if (global.errorHandlers.httpRequest) {
				try {
					const result = global.errorHandlers.httpRequest(ctr, context.error)
					if (isThenable(result)) await result
				} catch { }
			} else {
				context.response.status = 500
				context.response.statusText = null
				context.response.content = `An Error has occured:\n${context.error.toString()}`

				global.logger.error(`An Error has occured on ${method} ${context.url.href}\n${context.error.toString()}`)
			}
		}

		let content = parseContentSync(context.response.content, context.response.prettify, global.logger)
		if (isThenable(content)) content = await content

		if (req.isAborted()) return context.abort()

		for (const key in content.headers) {
			context.response.headers.set(key, content.headers[key])
		}

		req.compress(getCompressMethod(true, context.headers.get('accept-encoding', ''), content.content.byteLength, context.ip.isProxied, global))

		let continueWrites = writeHeadersSync(content.content, context, req)
		if (isThenable(continueWrites)) continueWrites = await continueWrites

		if (continueWrites) {
			await req
				.status(context.response.status, context.response.statusText || STATUS_CODES[context.response.status] || 'Unknown')
				.write(content.content)
		}
	}

	return await context.abort(ctr)
}
