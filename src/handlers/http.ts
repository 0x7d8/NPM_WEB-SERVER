import RequestContext from "@/types/internal/classes/RequestContext"
import { HttpContext } from "@/types/implementation/contexts/http"
import { Server, parseContent, version } from "@/index"
import { STATUS_CODES } from "http"
import writeHeaders from "@/functions/writeHeaders"
import getCompressMethod from "@/functions/getCompressMethod"
import { network } from "@rjweb/utils"
import { fileExists } from "@/functions/fileExists"
import { UsableMiddleware } from "@/classes/Middleware"
import YieldedResponse from "@/classes/YieldedResponse"

/**
 * Handler for HTTP Requests
 * @since 9.0.0
*/ export default async function handle(context: RequestContext, req: HttpContext, server: Server<any, any, any>, middlewares: UsableMiddleware[], customContext: Record<string, any>) {
	if (context.global.options.version) req.header('rjweb-server', version)
	req.header('date', new Date().toUTCString())

	context.response.headers.set('content-type', 'text/plain')
	context.response.headers.set('accept-ranges', 'none')

	if (req.aborted().aborted) return context.abort()

	if (context.url.method === 'GET') {
		context.body.raw = Buffer.allocUnsafe(0)
	}

	const ctr = new context.global.classContexts.HttpRequest(context, req, req.aborted())
	Object.assign(ctr["@"], customContext)

	if (context.global.options.proxy.enabled) {
		context.response.headers.set('proxy-authenticate', `Basic realm="Access rjweb-server@${version}"`)

		if (context.global.options.proxy.force) {
			if (!context.headers.has('proxy-authorization')) {
				await req
					.status(ctr.$status.PROXY_AUTHENTICATION_REQUIRED, STATUS_CODES[ctr.$status.PROXY_AUTHENTICATION_REQUIRED] || 'Unknown')
					.write(context.global.cache.arrayBufferTexts.proxy_auth_required)

				return
			}
		}


		if (!context.global.options.proxy.credentials.authenticate) context.ip.isProxied = true
		else if (context.headers.has('proxy-authorization')) {
			let authcheck = context.global.cache.proxyCredentials
			if (!authcheck) {
				authcheck = Buffer.from(`${context.global.options.proxy.credentials.username}:${context.global.options.proxy.credentials.password}`).toString('base64')
				context.global.cache.proxyCredentials = authcheck
			}

			if (context.headers.get('proxy-authorization') !== 'Basic '.concat(authcheck)) {
				await req
					.status(ctr.$status.UNAUTHORIZED, STATUS_CODES[ctr.$status.UNAUTHORIZED] || 'Unknown')
					.write(context.global.cache.arrayBufferTexts.proxy_auth_invalid)

				return
			} else context.ip.isProxied = true
		}

		const oldIp = context.ip.value
		if (context.ip.isProxied) {
			context.ip.value = context.headers.get(context.global.options.proxy.header, context.ip.value).split(',')[0].trim()
		}

		if (context.ip.isProxied && context.global.options.proxy.ips.validate) {
			if (context.global.options.proxy.ips.list.some((ip) => ip instanceof network.IPAddress ? ip.equals(ctr.client.ip) : ip.includes(ctr.client.ip))) {
				if (context.global.options.proxy.ips.mode === 'blacklist') {
					if (context.global.options.proxy.force) {
						await req
							.status(ctr.$status.PROXY_AUTHENTICATION_REQUIRED, STATUS_CODES[ctr.$status.PROXY_AUTHENTICATION_REQUIRED] || 'Unknown')
							.write(context.global.cache.arrayBufferTexts.proxy_auth_required)
		
						return
					} else {
						context.ip.isProxied = false
						context.ip.value = oldIp
						Object.assign(ctr.client, { ip: new network.IPAddress(oldIp) })
					}
				}
			}
		}
	}

	if (context.global.httpHandler) {
		try {
			await Promise.resolve(context.global.httpHandler(ctr, () => context.endFn = true))
		} catch (err) {
			context.handleError(err, 'http.handle.global.httpHandler')
		}

		if (req.aborted().aborted) return context.abort()
	}

	const split = context.url.path.split('/')
	let executedMiddlewares = false,
		ranBody = false

	for (const route of context.global.routes[context.type]) {
		if (route.matches(context.url.method, context.params, context.url.path, split)) {
			context.route = route

			if (!executedMiddlewares) for (let i = 0; i < middlewares.length; i++) {
				const middleware = middlewares[i]
		
				if (req.aborted().aborted) return context.abort()
				if (middleware.callbacks.httpRequest) {
					try {
						await Promise.resolve(middleware.callbacks.httpRequest(middleware.config, server, context, ctr, () => context.endFn = true))
					} catch (err) {
						context.handleError(err, `http.handle.middleware.${i}.httpRequest`)
					}
		
					if (context.endFn) break
				}
			}

			executedMiddlewares = true
		
			if (context.route.ratelimit && context.route.ratelimit.maxHits !== Infinity && context.route.ratelimit.timeWindow !== Infinity) {
				let data = context.global.rateLimits.get(`http+${ctr.client.ip}-${context.route.ratelimit.sortTo}`, {
					hits: 0,
					end: Date.now() + context.route.ratelimit.timeWindow
				})
		
				if (data.hits + 1 > context.route.ratelimit.maxHits && data.end > Date.now()) {
					if (data.hits === context.route.ratelimit.maxHits) data.end += context.route.ratelimit.penalty
		
					context.endFn = true
					if (context.global.rateLimitHandlers.httpRequest) {
						try {
							await Promise.resolve(context.global.rateLimitHandlers.httpRequest(ctr))
						} catch (err) {
							context.handleError(err, 'http.handle.rateLimitHandlers.httpRequest')
						}
					} else {
						context.response.status = 429
						context.response.statusText = 'Too Many Requests'
						context.response.content = context.global.cache.arrayBufferTexts.rate_limit_exceeded
					}
				} else if (data.end < Date.now()) {
					context.global.rateLimits.delete(`http+${ctr.client.ip}-${context.route.ratelimit.sortTo}`)
		
					data = {
						hits: 0,
						end: Date.now() + context.route.ratelimit.timeWindow
					}
				}
		
				context.response.headers.set('x-ratelimit-limit', context.route.ratelimit.maxHits.toString())
				context.response.headers.set('x-ratelimit-remaining', (context.route.ratelimit.maxHits - (data.hits + 1)).toString())
				context.response.headers.set('x-ratelimit-reset', Math.floor(data.end / 1000).toString())
				context.response.headers.set('x-ratelimit-policy', `${context.route.ratelimit.maxHits};w=${Math.floor(context.route.ratelimit.timeWindow / 1000)}`)
		
				context.global.rateLimits.set(`http+${ctr.client.ip}-${context.route.ratelimit.sortTo}`, {
					...data,
					hits: data.hits + 1
				})
			}
		
			if (req.aborted().aborted) return context.abort()
		
			if (context.route && !context.endFn) {
				let yieldedNow = false

				for (let i = 0; i < context.route.validators.length; i++) {
					const validator = context.route.validators[i]

					const values = Array.from(validator.listeners.httpRequest.values())
					for (let j = 0; j < validator.listeners.httpRequest.size; j++) {
						if (req.aborted().aborted) return
						const validate = values[j]
		
						try {
							const response = await Promise.resolve(validate(ctr, () => context.endFn = true, validator.data))

							if (response instanceof YieldedResponse) {
								context.yielded = response
								yieldedNow = true
							}
						} catch (err) {
							context.handleError(err, `ws.handle.validator.${i}.listeners.${j}.httpRequest`)
						}

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
				if (req.aborted().aborted) return context.abort()

				let yieldedNow = false
				switch (context.route.type) {
					case "http": {
						if (context.route.data.onRawBody && !ranBody) {
							ranBody = true
							await context.awaitBody(ctr, false)
						}
		
						if (context.route?.data.onRequest) try {
							const response = await Promise.resolve(context.route.data.onRequest(ctr))

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
							const response = await Promise.resolve(context.route.data.onUpgrade(ctr, () => context.endFn = true))

							if (response instanceof YieldedResponse) {
								context.yielded = response
								continue
							}
						} catch (err) {
							context.handleError(err, 'http.handle.onUpgrade')
						}
		
						context.response.status = 101
						context.response.statusText = 'Switching Protocols'
		
						if (!context.endFn && !context.error) {
							context.setExecuteSelf(async() => {
								await writeHeaders(null, context, req)
		
								context.body.chunks.length = 0
								context.body.raw = Buffer.allocUnsafe(0)
		
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

				if (req.aborted().aborted) return context.abort()
				if (yieldedNow) continue
			}

			break
		}
	}

	if (!context.endFn && !context.route && context.url.method === 'GET') {
		const cached = context.global.cache.staticFiles.get(context.url.path)

		if (cached) {
			context.file = cached[0]
			context.route = cached[1]
		}

		if (!context.route) for (const route of context.global.routes.static) {
			if (typeof route.urlData.value !== 'string') continue
			if (!context.url.path.startsWith(route.urlData.value)) continue

			const path = context.url.path.slice(route.urlData.value.length)

			if (!route.data.stripHtmlEnding) {
				const file = `${route.data.folder}/${path}`

				if (await fileExists(file)) {
					context.file = file
					context.route = route
					context.global.cache.staticFiles.set(context.url.path, [file, route])

					break
				}
			} else {
				{ // path/index.html
					const file = `${route.data.folder}/${path}/index.html`

					if (await fileExists(file)) {
						context.file = file
						context.route = route
						context.global.cache.staticFiles.set(context.url.path, [file, route])

						break
					}
				}

				{ // path.html
					const file = `${route.data.folder}/${path}.html`

					if (await fileExists(file)) {
						context.file = file
						context.route = route
						context.global.cache.staticFiles.set(context.url.path, [file, route])

						break
					}
				}

				{ // path
					const file = `${route.data.folder}/${path}`

					if (await fileExists(file)) {
						context.file = file
						context.route = route
						context.global.cache.staticFiles.set(context.url.path, [file, route])

						break
					}
				}
			}
		}

		if (context.route?.type === 'static') {
			if (context.file) {
				ctr.printFile(context.file)
			} else {
				context.global.logger.debug(`Static Route without File: ${context.url.path}`)
			}
		}
	}

	if (!context.route) {
		if (context.global.notFoundHandler) {
			try {
				await Promise.resolve(context.global.notFoundHandler(ctr))
			} catch (err) {
				context.handleError(err, 'http.handle.notFoundHandler')
			}
		} else {
			context.response.status = 404
			context.response.statusText = null
			context.response.content = context.global.cache.arrayBufferTexts.route_not_found
		}
	}

	if (req.aborted().aborted) return context.abort()

	if (context.error || await Promise.resolve(context['executeSelf']())) {
		if (context.error) {
			if (context.global.errorHandlers.httpRequest) {
				try {
					await Promise.resolve(context.global.errorHandlers.httpRequest(ctr, context.error))
				} catch { }
			} else {
				context.response.status = 500
				context.response.statusText = null
				context.response.content = `An Error has occured:\n${context.error.toString()}`

				context.global.logger.error(`An Error has occured on ${context.url.method} ${context.url.href}\n${context.error.toString()}`)
			}
		}

		const content = await parseContent(context.response.content, context.response.prettify, context.global.logger)
		
		if (req.aborted().aborted) return context.abort()

		for (const [ key, value ] of Object.entries(content.headers)) {
			context.response.headers.set(key, value)
		}

		const continueWrites = await writeHeaders(content.content, context, req)
		if (!continueWrites) return

		await req
			.compress(getCompressMethod(true, context.headers.get('accept-encoding', ''), content.content.byteLength, context.ip.isProxied, context.global))
			.status(context.response.status, context.response.statusText || STATUS_CODES[context.response.status] || 'Unknown')
			.write(content.content)
	}

	return context.abort(ctr)
}