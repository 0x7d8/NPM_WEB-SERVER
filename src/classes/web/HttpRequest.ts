import { HttpRequest, HttpResponse } from "@rjweb/uws"
import Status from "../../misc/statusEnum"
import Server from "../server"
import { LocalContext } from "../../types/context"
import parseContent, { Content } from "../../functions/parseContent"
import HTMLBuilder, { parseAttributes } from "../HTMLBuilder"
import { Readable } from "stream"
import Base from "./Base"
import Route from "../../types/http"
import handleCompressType from "../../functions/handleCompressType"
import { resolve as pathResolve } from "path"
import { getParts } from "@rjweb/uws"
import { promises as fs, Stats, createReadStream } from "fs"
import parseContentType from "../../functions/parseContentType"
import parseStatus from "../../functions/parseStatus"
import parseHeaders from "../../functions/parseHeaders"
import parseKV from "../../functions/parseKV"
import getCompressMethod from "../../functions/getCompressMethod"
import { createHash } from "crypto"

export const toArrayBuffer = (buffer: Buffer): ArrayBuffer => {
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
}

export default class HTTPRequest<Context extends Record<any, any> = {}, Body = unknown, Path extends string = '/'> extends Base<Context, Path> {
	/**
	 * Initializes a new Instance of a Web Context
	 * @since 7.0.0
	*/ constructor(controller: Server<any>, localContext: LocalContext, req: HttpRequest, res: HttpResponse, type: 'http' | 'upgrade') {
		super(controller, localContext)

		this.rawReq = req
		this.rawRes = res

		this.type = type
	}

	/**
	 * The Type of this Request
	 * @since 5.7.0
	*/ public readonly type: 'http' | 'upgrade'

	/**
	 * The Raw HTTP Server Req Variable
	 * @since 0.2.2
	*/ public readonly rawReq: HttpRequest
	/**
	 * The Raw HTTP Server Res Variable
	 * @since 0.2.2
	*/ public readonly rawRes: HttpResponse



	/**
	 * The Type of the HTTP Body
	 * @since 7.8.0
	*/ public get bodyType(): LocalContext['body']['type'] {
		if (!this.ctx.body.parsed) this.body

		return this.ctx.body.type
	}

	/**
	 * The Request Body (JSON Automatically parsed if enabled)
	 * @since 0.4.0
	*/ public get body(): Body {
		if (!this.ctx.body.raw.byteLength) {
			this.ctx.body.raw = Buffer.concat(this.ctx.body.chunks)
			this.ctx.body.chunks.length = 0
		}

		if (!this.ctx.body.parsed) {
			const stringified = this.ctx.body.raw.toString()

			switch (this.ctx.headers.get('content-type', '')) {
				case "application/json": {
					try { this.ctx.body.parsed = JSON.parse(stringified) }
					catch { this.ctx.body.parsed = stringified }

					this.ctx.body.type = 'json'

					break
				}

				case "application/x-www-form-urlencoded": {
					try { this.ctx.body.parsed = parseKV(stringified).toJSON() }
					catch { this.ctx.body.parsed = stringified }

					this.ctx.body.type = 'url-encoded'

					break
				}

				case "multipart/form-data": {
					try { this.ctx.body.parsed = getParts(stringified, 'multipart/form-data') }
					catch { this.ctx.body.parsed = stringified }

					if (!this.ctx.body.parsed) this.ctx.body.parsed = stringified
					else this.ctx.body.type = 'multipart'

					break
				}

				default: {
					this.ctx.body.parsed = stringified

					break
				}
			}
		}

		return this.ctx.body.parsed
	}

	/**
	 * The Raw Request Body
	 * @since 5.5.2
	*/ public get rawBody(): string {
		if (!this.ctx.body.raw.byteLength) {
			this.ctx.body.raw = Buffer.concat(this.ctx.body.chunks)
			this.ctx.body.chunks.length = 0
		}

		return this.ctx.body.raw.toString()
	}


	/**
	 * HTTP WWW-Authentication Checker
	 * @example
	 * ```
	 * const user = ctr.wwwAuth('basic', 'Access this Page.', { // Automatically adds www-authenticate header
	 *   bob: '123!',
	 *   rotvproHD: 'password'
	 * })
	 * 
	 * if (!user) return ctr.status((s) => s.UNAUTHORIZED).print('Invalid credentials')
	 * 
	 * ctr.print('You authenticated with user:', user)
	 * ```
	 * @since 8.0.0
	*/ public wwwAuth<Users extends Record<string, string>>(type: 'basic' | 'digest', reason: string, users: Users): keyof Users | null {
		if (type === 'basic') this.ctx.response.headers['www-authenticate'] = `Basic realm="${encodeURI(reason)}", charset="UTF-8"`
		else if (type === 'digest') this.ctx.response.headers['www-authenticate'] = `Digest realm="${encodeURI(reason)}", algorithm=MD5, nonce="${Math.random()}", cnonce="${Math.random()}", opaque="${createHash('md5').update(encodeURI(reason)).digest('hex')}", qop="auth", charset="UTF-8"`

		const spacePos = this.ctx.headers.get('authorization', '').indexOf(' ')
		const sentType = this.ctx.headers.get('authorization', '').slice(0, spacePos)
		const sentAuth = this.ctx.headers.get('authorization', '').slice(spacePos)

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
				for (const [ username, password ] of Object.entries(users)) {
					const info = parseKV(sentAuth, '=', ',', (s) => s.replaceAll('"', ''))

					const ha1 = createHash('md5').update(`${username}:${encodeURI(reason)}:${password}`).digest('hex')
					const ha2 = createHash('md5').update(`${this.ctx.url.method}:${info.get('uri')}`).digest('hex')

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
	 * The Request Status to Send
	 * @example
	 * ```
	 * ctr.status(401).print('Unauthorized')
	 * 
	 * // or
	 * ctr.status(666, 'The Devil').print('The Devil')
	 * 
	 * // or
	 * ctr.status((c) => c.IM_A_TEAPOT).print('Im a Teapot, mate!')
	 * ```
	 * @since 0.0.2
	*/ public status(code: number | ((codes: typeof Status) => number), message?: string): this {
		if (typeof code === 'function') this.ctx.response.status = code(Status)
		else this.ctx.response.status = code

		this.ctx.response.statusMessage = message

		return this
	}

	/**
	 * Redirect a Client to another URL
	 * @example
	 * ```
	 * ctr.redirect('https://example.com', 'permanent') // Will redirect to that URL
	 * ```
	 * @since 2.8.5
	*/ public redirect(location: string, type: 'temporary' | 'permanent' = 'temporary'): this {
		if (type === 'permanent') this.ctx.response.status = Status.MOVED_PERMANENTLY
		else this.ctx.response.status = Status.FOUND

		this.ctx.response.statusMessage = undefined

		this.ctx.response.headers['location'] = location

		return this
	}

	/**
	 * Print a Message to the Client (automatically Formatted)
	 * @example
	 * ```
	 * ctr.print({
	 *   message: 'this is json!'
	 * })
	 * 
	 * // or
	 * 
	 * ctr.print('this is text!')
	 * ```
	 * @since 0.0.2
	*/ public print(content: Content, options: {
		/**
		 * Whether to prettify output (currently just JSONs)
		 * @default false
		 * @since 6.2.0
		*/ prettify?: boolean
	} = {}): this {
		const prettify = options?.prettify ?? false

		this.ctx.response.content = content
		this.ctx.response.contentPrettify = prettify

		return this
	}

	/**
	 * Print a Message made using the HTML Builder & Formatter
	 * @example
	 * ```
	 * const userInput = '<script>alert("xss!!!!")</script>'
	 * 
	 * ctr.printHTML((html) => html
	 *   .t('head', {}, (t) => t
	 *     .t('title', {}, (t) => t
	 *       .escaped(userInput) // no xss attack because of .escaped()
	 *     )
	 *   )
	 *   .t('body', {}, (t) => t
	 *     .t(
	 *       'h1',
	 *       { style: { color: 'red' } },
	 *       (t) => t
	 *         .raw('Hello world matey!')
	 *     )
	 *   )
	 * )
	 * ```
	 * @since 6.6.0
	*/ public printHTML(callback: (html: HTMLBuilder) => HTMLBuilder, options: {
		/**
		 * The HTML Language to show at the top html tag
		 * @default 'en'
		 * @since 6.6.0
		*/ htmlLanguage?: string
	} = {}): this {
		const htmlLanguage = options?.htmlLanguage ?? 'en'

		const builder = new HTMLBuilder(this.ctx.execute.route?.path.toString() ?? 'default')
		callback(builder)

		this.ctx.response.headers['content-type'] = 'text/html'
		this.ctx.response.content = `<!DOCTYPE html><html ${parseAttributes({ lang: htmlLanguage }, [])}>${builder['html']}</html>`

		const path = this.ctx.url.path
		if (!this.ctg.routes.htmlBuilder.some((h) => h.path === path)) {
			for (const getEvery of builder['getEveries']) {
				const route: Route = {
					method: 'GET',
					path: `/___rjweb-html-auto/${getEvery.id}`,
					pathArray: `/___rjweb-html-auto/${getEvery.id}`.split('/'),
					async onRequest(ctr) {
						const res = await Promise.resolve(getEvery.getter(ctr as any))

						getEvery.fnArguments[getEvery.fnArguments.length - 1].value = res

						const builder = new HTMLBuilder(path, getEvery.fnArguments)
						getEvery.callback(builder, res)

						ctr.print(builder['html'])
					}, type: 'http',
					data: {
						headers: (this.ctx.execute.route as any)?.data.headers!,
						validations: this.ctx.execute.route?.data.validations!
					}, context: {
						data: {},
						keep: true
					}
				}

				this.ctg.routes.htmlBuilder.push(route)
				this.ctg.cache.routes.set(`/___rjweb-html-auto/${getEvery.id}`, undefined as any)
			}
		}

		return this
	}

	/**
	 * Print the Content of a File to the Client
	 * @example
	 * ```
	 * ctr.printFile('./profile.png', {
	 *   addTypes: true // Automatically add Content types
	 * })
	 * ```
	 * @since 0.6.3
	*/ printFile(file: string, options: {
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
		/**
		 * Whether to Cache the sent Files after accessed once (only renew after restart)
		 * @default false
		 * @since 2.2.0
		*/ cache?: boolean
	} = {}): this {
		const addTypes = options?.addTypes ?? true
		const compress = options?.compress ?? true
		const cache = options?.cache ?? false

		// Add Headers
		this.ctx.response.headers['accept-ranges'] = 'bytes'
		if (addTypes && !this.ctx.response.headers['content-type']) this.ctx.response.headers['content-type'] = parseContentType(file, this.ctg.contentTypes)

		this.ctx.setExecuteSelf(() => new Promise(async(resolve) => {
			let fileStat: Stats
			try {
				fileStat = await fs.stat(pathResolve(file))
			} catch (err) {
				this.ctx.handleError(err)
				return resolve(true)
			}

			let endEarly = false, start: number, end: number

			if (this.ctx.headers.has('range') && /bytes=\d+(-\d+)?/.test(this.ctx.headers.get('range', ''))) {
				const firstExpression = this.ctx.headers.get('range', '').match(/bytes=\d+(-\d+)?/)![0].substring(6)
				const [ startExpect, endExpect ] = firstExpression.split('-')

				if (!startExpect) start = 0
				else start = parseInt(startExpect)
				if (!endExpect) end = fileStat.size
				else end = parseInt(endExpect)

				if (end > fileStat.size) {
					this.ctx.response.status = Status.RANGE_NOT_SATISFIABLE
					this.ctx.response.statusMessage = undefined
					endEarly = true
				} else if (start < 0 || start > end || start > fileStat.size) {
					this.ctx.response.status = Status.RANGE_NOT_SATISFIABLE
					this.ctx.response.statusMessage = undefined
					endEarly = true
				}

				if (!endEarly) {
					this.ctx.response.status = Status.PARTIAL_CONTENT
					this.ctx.response.statusMessage = undefined
				}
			} else start = 0, end = fileStat.size

			// Get Compression Infos
			const [ compressMethod, compressHeader, compressWrite ] = getCompressMethod(compress, this.ctx.headers.get('accept-encoding', ''), this.rawRes, end - start, this.ctg)
			this.ctx.response.headers['content-encoding'] = compressHeader
			if (compressHeader) this.ctx.response.headers['vary'] = 'accept-encoding'

			// Add Range Headers if needed
			if (start !== 0 || end !== fileStat.size) {
				this.ctx.response.headers['content-range'] = `bytes ${start}-${end}/${compressHeader ? '*' : fileStat.size}`
			}

			// Add Last-Modified Header
			if (this.ctg.options.performance.lastModified) try {
				this.ctx.response.headers['last-modified'] = fileStat.mtime.toUTCString()
			} catch (err) {
				this.ctx.handleError(err)
				return resolve(true)
			}

			// Check Cache
			if (this.ctg.cache.files.has(`file::${file}`)) {
				this.ctx.response.content = this.ctg.cache.files.get(`file::${file}`)!
				this.ctx.response.headers['accept-range'] = undefined

				return resolve(true)
			} else if (this.ctg.cache.files.has(`file::${this.ctg.options.httpCompression}::${file}`)) {
				this.ctx.response.isCompressed = true
				this.ctx.response.content = this.ctg.cache.files.get(`file::${this.ctg.options.httpCompression}::${file}`)!
				this.ctx.response.headers['accept-range'] = undefined

				return resolve(true)
			}

			// Parse Headers
			const parsedHeaders = await parseHeaders(this.ctx.response.headers, this.ctg.logger)

			if (!this.ctx.isAborted) this.rawRes.cork(() => {
				if (!endEarly && (start !== 0 || end !== fileStat.size) && this.ctx.headers.get('if-unmodified-since') !== this.ctx.response.headers['last-modified']) {
					this.ctg.logger.debug('Ended unmodified-since request early because of no match')

					this.ctx.response.status = Status.PRECONDITION_FAILED
					this.ctx.response.statusMessage = undefined
					endEarly = true
				} else if (!endEarly && start === 0 && end === fileStat.size && this.ctg.options.performance.lastModified && this.ctx.headers.get('if-modified-since') === this.ctx.response.headers['last-modified']) {
					this.ctg.logger.debug('Ended modified-since request early because of match')

					this.ctx.response.status = Status.NOT_MODIFIED
					this.ctx.response.statusMessage = undefined
					endEarly = true
				}

				// Write Headers & Status
				if (!this.ctx.isAborted) this.rawRes.writeStatus(parseStatus(this.ctx.response.status))
				for (const header in parsedHeaders) {
					if (!this.ctx.isAborted) this.rawRes.writeHeader(header, parsedHeaders[header])
				}

				if (endEarly) {
					if (!this.ctx.isAborted) this.rawRes.end()
					return resolve(false)
				}

				// Get File Content
				if (compressHeader) this.ctg.logger.debug('negotiated to use', compressHeader)
				const compression = handleCompressType(compressMethod)
				const destroyStreams = () => {
					compression.destroy()
					stream.destroy()
				}

				// Handle Compression
				compression.on('data', (content: Buffer) => {
					this.rawRes.content = toArrayBuffer(content)

					if (!this.ctx.isAborted) {
						try {
							this.rawRes.contentOffset = this.rawRes.getWriteOffset()
							const ok = compressWrite(this.rawRes.content)

							if (!ok) {
								stream.pause()

								this.rawRes.onWritable((offset) => {
									const sliced = this.rawRes.content.slice(offset - this.rawRes.contentOffset)

									const ok = compressWrite(sliced)
									if (ok) {
										this.ctg.data.outgoing.increase(sliced.byteLength)
										this.ctg.logger.debug('sent http body chunk with bytelen', sliced.byteLength)
										stream.resume()
									}

									return ok
								})
							} else {
								this.ctg.data.outgoing.increase(content.byteLength)
								this.ctg.logger.debug('sent http body chunk with bytelen', content.byteLength)
							}
						} catch { }
					}

					// Write to Cache Store
					if (cache) {
						const oldData = this.ctg.cache.files.get(`file::${this.ctg.options.httpCompression}::${file}`, Buffer.allocUnsafe(0))
						this.ctg.cache.files.set(`file::${this.ctg.options.httpCompression}::${file}`, Buffer.concat([ oldData, content ]))
					}
				}).once('close', () => {
					if (compressHeader && !this.ctx.isAborted) this.rawRes.end()
					destroyStreams()

					this.ctx.events.unlist('requestAborted', destroyStreams)
					resolve(false)
				})

				const stream = createReadStream(pathResolve(file), { start, end })

				// Handle Errors
				stream.once('error', (err) => {
					this.ctx.handleError(err)
					return resolve(true)
				})

				// Handle Data
				stream.pipe(compression, { end: true })

				// Destroy if required
				this.ctx.events.listen('requestAborted', destroyStreams)
			})
			else resolve(false)
		}))

		return this
	}

	/**
	 * Print the data event of a Stream to the Client
	 * @example
	 * ```
	 * const fileStream = fs.createReadStream('./profile.png')
	 * ctr.printStream(fileStream)
	 * 
	 * // in this case though just use ctr.printFile since it does exactly this
	 * ```
	 * @since 4.3.0
	*/ printStream(stream: Readable, options: {
		/**
		 * Whether to end the Request after the Stream finishes
		 * @default true
		 * @since 4.3.5
		*/ endRequest?: boolean
		/**
		 * Whether to prettify output (currently just JSONs)
		 * @default false
		 * @since 7.4.0
		*/ prettify?: boolean
		/**
		 * Whether to Destroy the Stream when the Request gets aborted
		 * @default true
		 * @since 4.3.5
		*/ destroyAbort?: boolean
	} = {}): this {
		const endRequest = options?.endRequest ?? true
		const prettify = options?.prettify ?? false
		const destroyAbort = options?.destroyAbort ?? true

		this.ctx.setExecuteSelf(() => new Promise(async(resolve) => {
			const parsedHeaders = await parseHeaders(this.ctx.response.headers, this.ctg.logger)

			if (!this.ctx.isAborted) this.rawRes.cork(() => {
				// Write Headers & Status
				if (!this.ctx.isAborted) this.rawRes.writeStatus(parseStatus(this.ctx.response.status, this.ctx.response.statusMessage))
				for (const header in parsedHeaders) {
					if (!this.ctx.isAborted) this.rawRes.writeHeader(header, parsedHeaders[header])
				}

				const destroyStream = () => {
					stream.destroy()
				}

				const dataListener = async(data: Buffer) => {
					try {
						try {
							data = (await parseContent(data, prettify, this.ctg.logger)).content
						} catch (err) {
							return this.ctx.handleError(err)
						}

						if (!this.ctx.isAborted) this.rawRes.write(data)

						this.ctg.logger.debug('sent http body chunk with bytelen', data.byteLength)
						this.ctg.data.outgoing.increase(data.byteLength)
					} catch { }
				}, closeListener = () => {
					if (destroyAbort) this.ctx.events.unlist('requestAborted', destroyStream)
					if (endRequest) {
						resolve(false)
						if (!this.ctx.isAborted) this.rawRes.end()
					}
				}, errorListener = (error: Error) => {
					this.ctx.handleError(error)
					stream
						.removeListener('data', dataListener)
						.removeListener('close', closeListener)
						.removeListener('error', errorListener)

					return resolve(false)
				}

				if (destroyAbort) this.ctx.events.listen('requestAborted', destroyStream)

				stream
					.on('data', dataListener)
					.once('close', closeListener)
					.once('error', errorListener)

				this.ctx.events.listen('requestAborted', () => stream
					.removeListener('data', dataListener)
					.removeListener('close', closeListener)
					.removeListener('error', errorListener)
				)
			})
		}))

		return this
	}
}