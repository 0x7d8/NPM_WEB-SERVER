import { HttpRequest, HttpResponse } from "@rjweb/uws"
import Status from "../../misc/statusEnum"
import Server from "../webServer"
import { LocalContext } from "../../types/context"
import parseContent, { Content, ParseContentReturns } from "../../functions/parseContent"
import HTMLBuilder, { parseAttributes } from "../HTMLBuilder"
import { Readable } from "stream"
import Base from "./Base"
import Route from "../../types/http"
import handleContentType from "../../functions/handleContentType"
import handleCompressType, { CompressMapping } from "../../functions/handleCompressType"
import { resolve as pathResolve } from "path"
import { promises as fs, createReadStream } from "fs"
import parseStatus from "../../functions/parseStatus"
import parseHeaders from "../../functions/parseHeaders"

export default class HTTPRequest<Context extends Record<any, any> = {}, Body = unknown> extends Base<Context> {
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
	 * The Request Body (JSON Automatically parsed if enabled)
	 * @since 0.4.0
	*/ public get body(): Body {
		if (!this.ctx.body.raw.byteLength) {
			this.ctx.body.raw = Buffer.concat(this.ctx.body.chunks)
			this.ctx.body.chunks.length = 0
		}

		if (!this.ctx.body.parsed) {
			const stringified = this.ctx.body.raw.toString()

			if (this.ctg.options.body.parse && this.ctx.headers.get('content-type', '') === 'application/json') {
				try { this.ctx.body.parsed = JSON.parse(stringified) }
				catch { this.ctx.body.parsed = stringified }
			} else this.ctx.body.parsed = stringified
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
	 * Set an HTTP Header to add
	 * @example
	 * ```
	 * ctr.setHeader('Content-Type', 'text/plain').print('hello sir')
	 * ```
	 * @since 0.6.3
	*/ public setHeader(name: string, value: Content): this {
		this.ctx.response.headers[name.toLowerCase()] = value

		return this
	}

	/**
	 * The Request Status to Send
	 * @example
	 * ```
	 * ctr.status(401).print('Unauthorized')
	 * 
	 * // or
	 * ctr.status(666, 'The Devil').print('The Devil')
	 * ```
	 * @since 0.0.2
	*/ public status(code: number, message?: string): this {
		this.ctx.response.status = code ?? Status.OK
		this.ctx.response.statusMessage = message

		return this
	}

	/**
	 * Redirect a Client to another URL
	 * @example
	 * ```
	 * ctr.redirect('https://example.com') // Will redirect to that URL
	 * ```
	 * @since 2.8.5
	*/ public redirect(location: string, statusCode?: 301 | 302): this {
		this.status(statusCode ?? Status.FOUND)
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
		 * Whether to Cache the sent Files after accessed once (only renew after restart)
		 * @default false
		 * @since 2.2.0
		*/ cache?: boolean
	} = {}): this {
		const addTypes = options?.addTypes ?? true
		const cache = options?.cache ?? false

		// Add Headers
		if (addTypes) this.ctx.response.headers['content-type'] = Buffer.from(handleContentType(file, this.ctg))
		if (this.ctx.headers.get('accept-encoding', '').includes(CompressMapping[this.ctg.options.compression].toString())) {
			this.ctx.response.headers['content-encoding'] = CompressMapping[this.ctg.options.compression]
			this.ctx.response.headers['vary'] = 'Accept-Encoding'
		}

		this.ctx.setExecuteSelf(() => new Promise(async(resolve) => {
			if (this.ctg.options.performance.lastModified) try {
				const fileStat = await fs.stat(pathResolve(file))
				this.ctx.response.headers['last-modified'] = fileStat.mtime.toUTCString()
			} catch (err) {
				this.ctx.handleError(err)
				return resolve(true)
			}

			// Parse Headers
			const parsedHeaders = await parseHeaders(this.ctx.response.headers)

			if (!this.ctx.isAborted) this.rawRes.cork(() => {
				let endEarly = false
				if (this.ctg.options.performance.lastModified && this.ctx.headers.get('if-modified-since') === this.ctx.response.headers['last-modified']) {
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
					if (!this.ctx.isAborted) this.rawRes.end('')
					return resolve(false)
				}

				// Check Cache
				if (this.ctg.cache.files.has(`file::${file}`)) {
					this.ctx.response.content = this.ctg.cache.files.get(`file::${file}`)!

					return resolve(true)
				} else if (this.ctg.cache.files.has(`file::${this.ctg.options.compression}::${file}`)) {
					this.ctx.response.isCompressed = true
					this.ctx.response.content = this.ctg.cache.files.get(`file::${this.ctg.options.compression}::${file}`)!

					return resolve(true)
				}

				// Get File Content
				if (this.ctx.headers.get('accept-encoding', '').includes(CompressMapping[this.ctg.options.compression].toString())) {
					const destroyStreams = () => {
						stream.destroy()
						compression.destroy()
					}

					const compression = handleCompressType(this.ctg.options.compression)

					// Handle Compression
					compression.on('data', (content: Buffer) => {
						this.ctg.data.outgoing.increase(content.byteLength)

						if (!this.ctx.isAborted) this.rawRes.write(content)

						// Write to Cache Store
						if (cache) {
							const oldData = this.ctg.cache.files.get(`file::${this.ctg.options.compression}::${file}`, Buffer.allocUnsafe(0))
							this.ctg.cache.files.set(`file::${this.ctg.options.compression}::${file}`, Buffer.concat([ oldData, content ]))
						}
					}).once('close', () => {
						this.ctx.response.content = Buffer.allocUnsafe(0)
						this.ctx.events.removeListener('requestAborted', destroyStreams)
						resolve(false)
						if (!this.ctx.isAborted) this.rawRes.end()
					})

					const stream = createReadStream(pathResolve(file))

					// Handle Errors
					stream.once('error', (err) => {
						this.ctx.handleError(err)
						return resolve(true)
					})

					// Handle Data
					stream.pipe(compression)

					// Destroy if required
					this.ctx.events.once('requestAborted', destroyStreams)
				} else {
					const destroyStream = () => {
						stream.destroy()
					}

					const stream = createReadStream(pathResolve(file))

					// Handle Errors
					stream.once('error', (err) => {
						this.ctx.handleError(err)
						return resolve(true)
					})

					// Handle Data
					stream.on('data', (content: Buffer) => {
						this.ctg.data.outgoing.increase(content.byteLength)

						if (!this.ctx.isAborted) this.rawRes.write(content)

						// Write to Cache Store
						if (cache) {
							const oldData = this.ctg.cache.files.get(`file::${file}`, Buffer.allocUnsafe(0))
							this.ctg.cache.files.set(`file::${file}`, Buffer.concat([ oldData, content ]))
						}
					}).once('close', () => {
						this.ctx.response.content = Buffer.allocUnsafe(0)
						this.ctx.events.removeListener('requestAborted', destroyStream)
						resolve(true)
						if (!this.ctx.isAborted) this.rawRes.end()
					})

					// Destroy if required
					this.ctx.events.once('requestAborted', destroyStream)
				}
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
		 * Whether to Destroy the Stream when the Request gets aborted
		 * @default true
		 * @since 4.3.5
		*/ destroyAbort?: boolean
	} = {}): this {
		const endRequest = options?.endRequest ?? true
		const destroyAbort = options?.destroyAbort ?? true

		this.ctx.setExecuteSelf(() => new Promise(async(resolve) => {
			const parsedHeaders = await parseHeaders(this.ctx.response.headers)

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
						data = (await parseContent(data)).content
					} catch (err) {
						return this.ctx.handleError(err)
					}

					if (!this.ctx.isAborted) this.rawRes.write(data)

					this.ctg.data.outgoing.increase(data.byteLength)
				}, closeListener = () => {
					if (destroyAbort) this.ctx.events.removeListener('requestAborted', destroyStream)
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

				if (destroyAbort) this.ctx.events.once('requestAborted', destroyStream)

				stream
					.on('data', dataListener)
					.once('close', closeListener)
					.once('error', errorListener)

				this.ctx.events.once('requestAborted', () => stream
					.removeListener('data', dataListener)
					.removeListener('close', closeListener)
					.removeListener('error', errorListener)
				)
			})
		}))

		return this
	}
}