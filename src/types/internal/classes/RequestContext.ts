import Cookie from "@/classes/Cookie"
import Middleware, { UsableMiddleware } from "@/classes/Middleware"
import Route from "@/classes/Route"
import RuntimeError from "@/classes/RuntimeError"
import Server from "@/classes/Server"
import URLObject from "@/classes/URLObject"
import ValueCollection from "@/classes/ValueCollection"
import YieldedResponse from "@/classes/YieldedResponse"
import HttpRequestContext from "@/classes/request/HttpRequestContext"
import parseURL from "@/functions/parseURL"
import { Content, Method, ParsedBody } from "@/types/global"
import { HttpContext } from "@/types/implementation/contexts/http"
import GlobalContext from "@/types/internal/classes/GlobalContext"

export default class RequestContext<MiddlewareData extends Record<any, any> = any> {
	protected executeSelf: () => Promise<boolean> | boolean = () => true
	private middlewareData: Record<string, any> = {}
	private started = performance.now()
	private aborted = false

	constructor(private context: HttpContext, private middlewares: UsableMiddleware[], private server: Server<any>, global: GlobalContext) {
		this.url = new URLObject(context.path(), context.method())
		this.type = context.type()

		this.global = global
		this.headers = context.getHeaders()

		this.ip = {
			isProxied: false,
			isInternal: false,
			value: context.clientIP(),
			port: context.clientPort()
		}
	}

	/**
	 * The URL Object
	 * @since 9.0.0
	*/ public url: URLObject
	/**
	 * The Headers of the URL Path
	 * @since 9.0.0
	*/ public headers: ValueCollection<string, string>
	/**
	 * The Params of the URL Path
	 * @since 9.0.0
	*/ public params = new ValueCollection<string, string>()
	/**
	 * The Cookies of the Request
	 * @since 9.0.0
	*/ public cookies: ValueCollection<string, string, Cookie> | null = null
	/**
	 * The Queries of the Request
	 * @since 9.0.0
	*/ public queries: ValueCollection<string, string> | null = null
	/**
	 * The Fragments of the Request
	 * @since 9.0.0
	*/ public fragments: ValueCollection<string, string> | null = null
	/**
	 * The Error this request encountered
	 * @since 9.0.0
	*/ public error: RuntimeError | null = null
	/**
	 * The Type of the Request
	 * @since 9.0.0
	*/ public type: 'http' | 'ws'
	/**
	 * What headers affected the response (vary)
	 * @since 9.3.4
	*/ public vary: Set<string> = new Set()
	/**
	 * Whether the EndFn was called
	 * @since 9.0.0
	*/ public endFn = false
	/**
	 * Whether the Request is chunked
	 * @since 9.0.0
	*/ public chunked = false
	/**
	 * The Yielded Response
	 * @since 9.2.0
	*/ public yielded: YieldedResponse | null = null
	/**
	 * The File to print at the end of the request
	 * @warn Only used in static routes, do not use in other routes
	 * @since 9.0.0
	*/ public file: string | null = null

	/**
	 * Set Code to execute at the end end of the request,
	 * return a boolean describing if you want the normal request end to proceed too
	 * @since 9.0.0
	*/ public setExecuteSelf(callback: () => Promise<boolean> | boolean): this {
		const old = this.executeSelf
		this.executeSelf = async() => {
			const result = await Promise.resolve(old())
			if (!result) return false

			return await Promise.resolve(callback())
		}

		return this
	}

	/**
	 * Handle an Error, automatically sets status and calls callback
	 * @since 9.0.0
	*/ public handleError(error: unknown, cause: string): RuntimeError {
		this.error = new RuntimeError(cause, error)

		return this.error
	}

	/**
	 * Get the Route that matches the input
	 * @since 9.4.0
	*/ public findRoute(method: Method, path: string): Route<'http'> | Route<'ws'> | null {
		const split = parseURL(path).path.split('/')

		for (const route of this.global.routes[this.type]) {
			if (route.matches(method, null, path, split) || (this.global.options.methods.head && route.matches('GET', null, this.url.path, split))) {
				return route
			}
		}

		return null
	}

	/**
	 * Initiate Request Abortion
	 * @since 9.0.0
	*/ public async abort(ctr?: HttpRequestContext<any>): Promise<boolean> {
		if (this.aborted) return true

		if (!ctr) this.global.logger.debug(`Aborted Request on ${this.url.method} ${this.url.href}`)

		if (ctr) {
			for (let i = 0; i < this.middlewares.length; i++) {
				const middleware = this.middlewares[i]
		
				if (middleware.finishCallbacks.httpRequest) try {
					await Promise.resolve(middleware.finishCallbacks.httpRequest(middleware.config, this.server, this, ctr, this.elapsed()))
				} catch { }
			}

			if (this.global.finishHandlers.httpRequest) try {
				await Promise.resolve(this.global.finishHandlers.httpRequest(ctr, this.elapsed()))
			} catch { }
		}

		this.aborted = !ctr
		return false
	}

	/**
	 * Retrieve Middleware Data
	 * @since 9.0.0
	*/ public data(middleware: Middleware | UsableMiddleware<any, any, any, any, any> | { use(...args: any[]): UsableMiddleware<any, any, any, any, any> }): MiddlewareData {
		const key = middleware instanceof Middleware ? middleware['name'] : 'use' in middleware ? middleware.use().infos.name : middleware.infos.name

		if (!this.middlewareData[key]) this.middlewareData[key] = {}
		return this.middlewareData[key]
	}

	/**
	 * Await the Body
	 * @since 9.0.0
	*/ public async awaitBody(ctr: HttpRequestContext<any>, concat = true): Promise<Buffer> {
		if (this.url.method === 'GET') return Buffer.allocUnsafe(0)
		if (this.body.awaiting) return new Promise((resolve) => this.body.callbacks.push(resolve))
		if (this.body.raw) return this.body.raw

		this.body.awaiting = true
		await this.context.onBodyChunk(async(chunk, isLast) => {
			const buffer = Buffer.from(chunk)

			if (this.context.aborted().aborted) return this.abort()

			if (this.route?.type === 'http' && !this.route.data.onRawBody && concat) this.body.chunks.push(buffer)
			else if (this.route?.type === 'http') try {
				if (!this.endFn) await Promise.resolve(this.route.data.onRawBody?.(ctr, () => this.endFn = true, buffer, isLast))
			} catch (err) {
				this.handleError(err, 'http.handle.onRawBody')
			}

			if (isLast && concat) {
				this.body.raw = Buffer.concat(this.body.chunks)
				this.body.chunks.length = 0
				for (const callback of this.body.callbacks) {
					callback(this.body.raw)
				}

				this.body.callbacks.length = 0
			}
		})

		return this.body.raw!
	}

	/**
	 * Get the ms elapsed since the request started
	 * @since 9.0.0
	*/ public elapsed(reset = false): number {
		const ms = performance.now() - this.started
		if (reset) this.started = performance.now()

		return ms
	}

	/**
	 * Body / Ws Message Data
	 * @since 9.0.0
	*/ public body: {
		/**
		 * The Chunks of the Body
		 * @since 9.0.0
		*/ chunks: Buffer[]
		/**
		 * Callbacks that get called when full body is resolved
		 * @since 9.0.0
		*/ callbacks: ((raw: Buffer) => void)[]
		/**
		 * The Raw Data of the Body
		 * @since 9.0.0
		*/ raw: Buffer | null
		/**
		 * The Parsed Data of the Body
		 * @since 9.0.0
		*/ parsed: ParsedBody
		/**
		 * Whether the Body is being awaited
		 * @since 9.0.0
		*/ awaiting: boolean
		/**
		 * The Type of the parsed Body
		 * @since 9.0.0
		*/ type: 'json' | 'url-encoded' | 'raw'
	} = {
		chunks: [],
		callbacks: [],
		raw: null,
		parsed: '',
		awaiting: false,
		type: 'raw'
	}

	/**
	 * IP Information
	 * @since 9.0.0
	*/ public ip: {
		/**
		 * Whether the IP is Proxied
		 * @since 9.0.0
		*/ isProxied: boolean
		/**
		 * Whether the IP is from an internal request
		 * @since 9.3.0
		*/ isInternal: boolean
		/**
		 * The Value of the IP
		 * @since 9.0.0
		*/ value: string
		/**
		 * The Port that the IP is using
		 * @since 9.0.0
		*/ port: number
	}

	/**
	 * The Global Context
	 * @since 9.0.0
	*/ public global: GlobalContext

	/**
	 * The Route, if found
	 * @since 9.0.0
	*/ public route: Route<'http'> | Route<'ws'> | Route<'static'> | null = null

	/**
	 * The Response Data
	 * @since 9.0.0
	*/ public response: {
		/**
		 * The Status Code to send
		 * @default 200
		 * @since 9.0.0
		*/ status: number
		/**
		 * The Status Text to send
		 * @default null
		 * @since 9.0.0
		*/ statusText: string | null

		/**
		 * The Headers to send
		 * @since 9.0.0
		*/ headers: ValueCollection<string, string>
		/**
		 * The Cookies to add
		 * @since 9.0.0
		*/ cookies: ValueCollection<string, Cookie>

		/**
		 * The Content to send
		 * @default []
		 * @since 9.0.0
		*/ content: Content
		/**
		 * Whether to prettify the content
		 * @default false
		 * @since 9.0.0
		*/ prettify: boolean
	} = {
		status: 200,
		statusText: null,
		headers: new ValueCollection(),
		cookies: new ValueCollection(),
		content: Buffer.allocUnsafe(0),
		prettify: false
	}
}