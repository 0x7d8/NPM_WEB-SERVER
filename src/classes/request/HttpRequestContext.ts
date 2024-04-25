import InternalRequestContext from "@/types/internal/classes/RequestContext"
import { HttpContext } from "@/types/implementation/contexts/http"
import { Content, ParsedBody, RatelimitInfos, Status } from "@/types/global"
import Base from "@/classes/request/Base"
import * as fs from "fs/promises"
import * as path from "path"
import { Stats } from "fs"
import writeHeaders from "@/functions/writeHeaders"
import { STATUS_CODES } from "http"
import parseContentType from "@/functions/parseContentType"
import { ZodResponse } from "@/types/internal"
import { z } from "zod"
import parseKV from "@/functions/parseKV"
import getCompressMethod from "@/functions/getCompressMethod"
import status from "@/enums/status"
import { Duplex, Writable } from "stream"
import parseContent from "@/functions/parseContent"
import { createHash } from "crypto"
import YieldedResponse from "@/classes/YieldedResponse"

export default class HttpRequestContext<Context extends Record<any, any> = {}> extends Base<Context> {
	constructor(context: InternalRequestContext, private rawContext: HttpContext, private abort: AbortSignal) {
		super(context)

		this.type = context.type
	}

	/**
	 * The Type of this Request
	 * @since 5.7.0
	*/ public readonly type: 'http' | 'ws'

	/**
	 * HTTP Status Codes Enum
	 * @since 9.0.0
	*/ public $status = status
	/**
	 * HTTP Abort Controller (please use to decrease server load)
	 * @since 9.0.0
	*/ public $abort(callback?: () => void): boolean {
		if (callback) this.abort.addEventListener('abort', callback)

		return this.abort.aborted
	}

	/**
	 * The Request Body (JSON and Urlencoding Automatically parsed if enabled)
	 * @since 0.4.0
	*/ public async body(): Promise<ParsedBody> {
		const body = await this.context.awaitBody(this)

		if (!this.context.body.parsed) {
			const stringified = body.toString()

			switch (this.context.headers.get('content-type', '')) {
				case "application/json": {
					try {
						this.context.body.parsed = JSON.parse(stringified)
						this.context.body.type = 'json'
					} catch {
						this.context.body.parsed = stringified
					}

					break
				}

				case "application/x-www-form-urlencoded": {
					try {
						this.context.body.parsed = parseKV('Object', stringified)
						this.context.body.type = 'url-encoded'
					} catch {
						this.context.body.parsed = stringified
					}

					break
				}

				default: {
					this.context.body.parsed = stringified

					break
				}
			}
		}

		return this.context.body.parsed
	}

	/**
	 * The HTTP Body Type
	 * @since 9.0.0
	*/ public async bodyType(): Promise<'raw' | 'json' | 'url-encoded'> {
		await this.body()

		return this.context.body.type
	}

	/**
	 * The Raw Request Body
	 * @since 5.5.2
	*/ public async rawBody(encoding: BufferEncoding): Promise<string> {
		const body = await this.context.awaitBody(this)

		return body.toString(encoding)
	}

	/**
	 * The Raw Request Body as Buffer
	 * @since 8.1.4
	*/ public async rawBodyBytes(): Promise<Buffer> {
		const body = await this.context.awaitBody(this)

		return body
	}

	/**
	 * Bind the Body using Zod
	 * 
	 * This uses `.body` internally so no binary data
	 * @example
	 * ```
	 * const [ data, error ] = await ctr.bindBody((z) => z.object({
	 *   name: z.string().max(24),
	 *   gender: z.union([ z.literal('male'), z.literal('female') ])
	 * }))
	 * 
	 * if (!data) return ctr.status((s) => s.BAD_REQUEST).print(error.toString())
	 * 
	 * ctr.print('Everything valid! 👍')
	 * ctr.printPart(`
	 *   your name is ${data.name}
	 *   and you are a ${data.gender}
	 * `)
	 * ```
	 * @since 8.8.0
	*/ public async bindBody<Schema extends z.ZodTypeAny>(schema: Schema | ((z: typeof import('zod')) => Schema)): Promise<ZodResponse<Schema>> {
		const fullSchema = typeof schema === 'function' ? schema(z as any) : schema,
			parsed = await fullSchema.safeParseAsync(await this.body())

		if (!parsed.success) return [null, parsed.error]
		return [parsed.data, null]
	}

	/**
	 * HTTP WWW-Authentication Checker
	 * 
	 * This will validate the Authorization Header using the WWW-Authentication Standard,
	 * you can choose between `basic` and `digest` authentication, in most cases `digest`
	 * should be used unless you are using an outdated client or want to test easily.
	 * When not matching any user the method will return `null` and the request should be
	 * ended with a `Status.UNAUTHORIZED` (401) status code.
	 * @example
	 * ```
	 * const user = ctr.wwwAuth('basic', 'Access this Page.', { // Automatically adds www-authenticate header
	 *   bob: '123!',
	 *   rotvproHD: 'password'
	 * })
	 * 
	 * if (!user) return ctr.status(ctr.$status.UNAUTHORIZED).print('Invalid credentials')
	 * 
	 * ctr.print(`You authenticated with user: ${user}`)
	 * ```
	 * @since 8.0.0
	*/ public wwwAuth<Users extends Record<string, string>>(type: 'basic' | 'digest', reason: string, users: Users): keyof Users | null {
		if (type === 'basic') this.headers.set('www-authenticate', `Basic realm="${encodeURI(reason)}", charset="UTF-8"`)
		else if (type === 'digest') this.headers.set('www-authenticate', `Digest realm="${encodeURI(reason)}", algorithm=MD5, nonce="${Math.random()}", cnonce="${Math.random()}", opaque="${createHash('md5').update(encodeURI(reason)).digest('hex')}", qop="auth", charset="UTF-8"`)

		const spacePos = this.headers.get('authorization', '').indexOf(' ')
		if (spacePos === -1) return null

		const sentType = this.headers.get('authorization', '').slice(0, spacePos),
			sentAuth = this.headers.get('authorization', '').slice(spacePos).trim()

		if (!sentType || !sentAuth) return null
		let user: keyof Users | null = null

		switch (sentType.toLowerCase()) {
			case "basic": {
				for (const [ username, password ] of Object.entries(users)) {
					if (sentAuth === Buffer.from(`${username}:${password}`).toString('base64')) {
						user = username
						break
					}
				}

				break
			}

			case "digest": {
				const info = parseKV('ValueCollection', sentAuth, '=', ',', (s) => s.replaceAll('"', '')),
					ha2 = createHash('md5').update(`${this.url.method}:${info.get('uri')}`).digest('hex')

				for (const [ username, password ] of Object.entries(users)) {
					const ha1 = createHash('md5').update(`${username}:${encodeURI(reason)}:${password}`).digest('hex')

					if (info.get('response') === createHash('md5').update(`${ha1}:${info.get('nonce')}:${info.get('nc')}:${info.get('cnonce')}:${info.get('qop')}:${ha2}`).digest('hex')) {
						user = username
						break
					}
				}

				break
			}
		}

		return user
	}

	/**
	 * Yield the Request to the next Route that matches the URL
	 * 
	 * This will yield the request to the next route that matches the URL, this is useful
	 * if you want to have multiple routes that match the same URL but have different methods
	 * or if you want to have a fallback route that matches all URLs. You can also pass data
	 * to the next route by providing it as an argument.
	 * @example
	 * ```
	 * const server = new Server(...)
	 * 
	 * server.path('/api', (path) => path
	 *   .http('GET', '/', (http) => http
	 *     .onRequest((ctr) => {
	 *       if (ctr.queries.has('yield')) return ctr.yield('Hello World!')
	 * 
	 *       ctr.headers.set('content-type', 'text/html')
	 *       ctr.print('<a href="/api/hello?yield">yield this shit</a>')
	 *     })
	 *   )
	 *   .http('GET', '/', (http) => http
	 *     .onRequest((ctr) => {
	 *       ctr.print(`u yielded, ${ctr.yield().data()}`) // u yielded, Hello World!
	 *     })
	 *   )
	 * )
	 * ```
	 * @since 9.2.0
	*/ public yield<Data = unknown>(data?: Data): YieldedResponse<Data> {
		if (data === undefined && !this.context.yielded) throw new Error('Cannot yield without data when no data was provided before')
		else if (data === undefined) return this.context.yielded as YieldedResponse<Data>

		this.context.yielded = new YieldedResponse(data)
		return this.context.yielded as YieldedResponse<Data>
	}

	/**
	 * Clear the active Ratelimit of the Client
	 * 
	 * This Clears the currently active Ratelimit (on this endpoint) of the Client, remember:
	 * you cant call this in a normal endpoint if the max hits are already reached since well...
	 * they are already reached.
	 * @since 8.6.0
	*/ public clearRateLimit(): this {
		if (!this.context.route || !this.context.route.ratelimit || this.context.route.ratelimit.maxHits === Infinity) return this
		this.global.rateLimits.delete(`http+${this.client.ip}-${this.context.route.ratelimit.sortTo}`)

		return this
	}

	/**
	 * Skips counting the request to the Client IPs Rate limit (if there is one)
	 * 
	 * When a specific IP makes a request to an endpoint under a ratelimit, the maxhits will be
	 * increased instantly to prevent bypassing the rate limit by spamming requests faster than the host can
	 * handle. When this function is called, the server removes the set hit again.
	 * @since 8.6.0
	*/ public skipRateLimit(): this {
		if (!this.context.route || !this.context.route.ratelimit || this.context.route.ratelimit.maxHits === Infinity) return this

		const data = this.global.rateLimits.get(`http+${this.client.ip}-${this.context.route.ratelimit.sortTo}`, {
			hits: 1,
			end: Date.now() + this.context.route.ratelimit.timeWindow
		})

		if (data.hits === 0) return this

		this.global.rateLimits.set(`http+${this.client.ip}-${this.context.route.ratelimit.sortTo}`, {
			...data,
			hits: data.hits - 1
		})

		return this
	}

	/**
	 * Get Infos about the current Ratelimit
	 * 
	 * This will get all information about the currently applied ratelimit
	 * to the endpoint. If none is active, will return `null`.
	 * @since 8.6.0
	*/ public getRateLimit(): RatelimitInfos | null {
		if (!this.context.route || !this.context.route.ratelimit || this.context.route.ratelimit.maxHits === Infinity) return null

		const data = this.global.rateLimits.get(`http+${this.client.ip}-${this.context.route.ratelimit.sortTo}`, {
			hits: 0,
			end: Date.now() + this.context.route.ratelimit.timeWindow
		})

		return {
			hits: data.hits,
			maxHits: this.context.route.ratelimit.maxHits,
			hasPenalty: data.hits > this.context.route.ratelimit.maxHits,
			penalty: this.context.route.ratelimit.penalty,
			timeWindow: this.context.route.ratelimit.timeWindow,
			get endsAt() { return new Date(data.end) },
			endsIn: data.end - Date.now()
		}
	}

	/**
	 * The Request Status to Send
	 * 
	 * This will set the status of the request that the client will recieve, by default
	 * the status will be `200`, the server will not change this value unless calling the
	 * `.redirect()` method. If you want to add a custom message to the status you can provide
	 * a second argument that sets that, for RFC documented codes this will automatically be
	 * set but can be overridden, the mapping is provided by `http.STATUS_CODES`
	 * @example
	 * ```
	 * ctr.status(401).print('Unauthorized')
	 * 
	 * // or
	 * ctr.status(666, 'The Devil').print('The Devil')
	 * 
	 * // or
	 * ctr.status(ctr.$status.IM_A_TEAPOT).print('Im a Teapot, mate!')
	 * ```
	 * @since 0.0.2
	*/ public status(code: number, message?: string): this {
		this.context.response.status = code
		this.context.response.statusText = message || null

		return this
	}

	/**
	 * Redirect a Client to another URL
	 * 
	 * This will set the location header and the status to either to 301 or 302 depending
	 * on whether the server should tell the browser that the page has permanently moved
	 * or temporarily. Obviously this will only work correctly if the client supports the
	 * 30x Statuses combined with the location header.
	 * @example
	 * ```
	 * ctr.redirect('https://example.com', 'permanent') // Will redirect to that URL
	 * ```
	 * @since 2.8.5
	*/ public redirect(location: string, type: 'temporary' | 'permanent' = 'temporary'): this {
		if (type === 'permanent') this.context.response.status = Status.MOVED_PERMANENTLY
		else this.context.response.status = Status.FOUND

		this.context.response.statusText = null
		this.context.response.headers.set('location', location)

		return this
	}

	/**
	 * Print a Message to the Client (automatically Formatted)
	 * 
	 * This Message will be the one actually sent to the client, nothing
	 * can be "added" to the content using this function, it can only be replaced using `.print()`
	 * To add content to the response body, use `.printPart()` instead.
	 * @example
	 * ```
	 * ctr.print({
	 *   message: 'this is json!'
	 * })
	 * 
	 * // content will be `{"message":"this is json!"}`
	 * 
	 * /// or
	 * 
	 * ctr.print({
	 *   message: 'this is json!'
	 * }, true)
	 * // content will be `{\n  "message": "this is json!"\n}`
	 * 
	 * /// or
	 * 
	 * ctr.print('this is text!')
	 * // content will be `this is text!`
	 * ```
	 * @since 0.0.2
	*/ public print(content: Content, prettify: boolean = false): this {
		this.context.response.content = content
		this.context.response.prettify = prettify

		return this
	}

	/**
	 * Print a Message to the client (without resetting the previous message state)
	 * 
	 * This will turn your response into a chunked response, this means that you cannot
	 * add headers or cookies after this function has been called. This function is useful
	 * if you want to add content to the response body without resetting the previous content.
	 * And when you manually want to print massive amounts of data to the client without having
	 * to store it in memory.
	 * @example
	 * ```
	 * const file = fs.createReadStream('./10GB.bin')
	 *
	 * ctr.printChunked((print) => new Promise<void>((end) => {
	 *   file.on('data', (chunk) => {
	 *     file.pause()
	 *     print(chunk)
	 *       .then(() => file.resume())
	 *   })
	 * 
	 *   file.on('end', () => {
	 *     end()
	 *   })
	 * 
	 *   ctr.$abort(() => {
	 *     file.destroy()
	 *     end()
	 *   })
	 * }))
	 * ```
	 * @since 8.2.0
	*/ public printChunked<Callback extends ((print: (content: Content) => Promise<void>) => Promise<any>) | null>(callback: Callback): Callback extends null ? Writable : this {
		if (this.context.chunked) throw new Error('Cannot call printChunked multiple times')
		
		this.context.chunked = true
		
		let canStartReading: () => void = () => {},	
			canStartReadingBool = false

		const stream = new Duplex({
			read() {
				canStartReading()
				canStartReadingBool = true
			}, write(chunk, _, callback) {
				this.push(chunk)
				callback()
			}, final(callback) {
				this.push(null)
				callback()
			}
		})

		stream.pause()

		this.context.setExecuteSelf(() => new Promise(async(resolve) => {
			await writeHeaders(null, this.context, this.rawContext)

			this.rawContext
				.compress(getCompressMethod(true, this.headers.get('accept-encoding', ''), 0, this.context.ip.isProxied, this.context.global))
				.status(this.context.response.status, this.context.response.statusText || STATUS_CODES[this.context.response.status] || 'Unknown')
				.write(stream)

			resolve(false)

			if (!callback) return

			if (!canStartReadingBool) await new Promise<void>((resolve) => {
				canStartReading = resolve
			})

			stream.resume()

			try {
				await callback(async(content) => {
					const { content: parsed } = await parseContent(content, this.context.response.prettify, this.context.global.logger)

					await new Promise<void>((resolve) => stream.write(new Uint8Array(parsed), () => resolve()))
				}).then(() => stream.end())
			} catch (err) {
				console.error(err)
			}
		}))

		if (!callback) return stream as any
		return this as any
	}

	/**
	 * Print the Content of a File to the Client
	 * 
	 * This will print a file to the client using transfer encoding chunked and
	 * if `addTypes` is enabled automatically add some content types based on the
	 * file extension. This function wont respect any other http response body set by
	 * `.print()` or any other normal print as this overwrites the custom ctx execution
	 * function.
	 * @example
	 * ```
	 * ctr.printFile('./profile.png', {
	 *   addTypes: true // Automatically add Content types
	 * })
	 * ```
	 * @since 0.6.3
	*/ public printFile(file: string, options: {
		/**
		 * The Name of the File (if not set, the basename of the file will be used)
		 * 
		 * Only applied if the `content-disposition` header is not set and options.download is true
		 * @default path.basename(file)
		 * @since 9.1.4
		*/ name?: string
		/**
		 * Whether to download the file or display it in the browser
		 * @default ctr.headers.get('content-type') === 'application/octet-stream'
		 * @since 9.1.4
		*/ download?: boolean
		/**
		 * Whether some Content Type Headers will be added automatically
		 * @default true
		 * @since 2.2.0
		*/ addTypes?: boolean
		/**
		 * Whether to compress this File
		 * @default true
		 * @since 7.9.0
		*/ compress?: boolean
	} = {}): this {
		const addTypes = options?.addTypes ?? true
		const compress = options?.compress ?? true

		this.context.response.headers.set('accept-ranges', 'bytes')
		if (addTypes && this.context.response.headers.get('content-type', 'text/plain') === 'text/plain') this.context.response.headers.set('content-type', parseContentType(file, this.global.contentTypes))

		this.context.setExecuteSelf(() => new Promise(async(resolve) => {
			file = path.resolve(file)

			let fileStat: Stats
			try {
				fileStat = await fs.stat(file)

				if (!fileStat.isFile() && !fileStat.isFIFO()) throw new Error('Not a File')

				this.headers.set('content-length', fileStat.size.toString())
				if (!this.headers.has('content-disposition')) {
					this.headers.set('content-disposition', `${options.download ?? this.headers.get('content-type') === 'application/octet-stream' ? 'attachment' : 'inline'}; filename="${options.name ?? path.basename(file)}"`)
				}
			} catch (err) {
				this.context.handleError(err, 'printFile.fs.stat')
				return resolve(true)
			}

			let endEarly = false, start: number, end: number

			if (this.context.headers.has('range')) {
				const match = this.context.headers.get('range', '').match(/bytes=\d+(-\d+)?/)
				if (match) {
					const firstExpression = match[0].substring(6)
					const [ startExpect, endExpect ] = firstExpression.split('-')

					if (!startExpect) start = 0
					else start = parseInt(startExpect)
					if (!endExpect) end = fileStat.size
					else end = parseInt(endExpect)

					if (end > fileStat.size) {
						this.context.response.status = Status.RANGE_NOT_SATISFIABLE
						this.context.response.statusText = null
						endEarly = true
					} else if (start < 0 || start > end || start > fileStat.size || start > Number.MAX_SAFE_INTEGER || end > Number.MAX_SAFE_INTEGER) {
						this.context.response.status = Status.RANGE_NOT_SATISFIABLE
						this.context.response.statusText = null
						endEarly = true
					}

					if (!endEarly) {
						this.context.response.status = Status.PARTIAL_CONTENT
						this.context.response.statusText = null
					}
				} else start = 0, end = fileStat.size
			} else start = 0, end = fileStat.size

			if (start !== 0 || end !== fileStat.size) {
				this.headers.set('content-range', `bytes ${start}-${end}/${fileStat.size}`)
			}

			if (this.global.options.performance.lastModified) {
				const lastModified = fileStat.mtime.toUTCString()

				this.context.response.headers.set('last-modified', lastModified)

				if (this.context.headers.get('if-modified-since') === lastModified) {
					await this.rawContext.status(Status.NOT_MODIFIED, STATUS_CODES[this.context.response.status] || 'Unknown').write(new ArrayBuffer(0))
					return resolve(false)
				}
			}

			const continueWrites = await writeHeaders(null, this.context, this.rawContext)
			if (!continueWrites) return resolve(false)

			this.rawContext
				.compress(getCompressMethod(compress, this.headers.get('accept-encoding', ''), fileStat.size, this.context.ip.isProxied, this.global))
				.status(this.context.response.status, this.context.response.statusText || STATUS_CODES[this.context.response.status] || 'Unknown')
				.writeFile(file, start, end)

			return resolve(false)
		}))

		return this
	}
}