import WebSocket from "../../types/webSocket"
import HTTP from "../../types/http"
import { ExternalRouter, HTTPMethods, MiddlewareInitted, RoutedValidation } from "../../types/internal"
import addPrefixes from "../../functions/addPrefixes"
import { Content } from "../../functions/parseContent"
import parsePath from "../../functions/parsePath"

import RouteWS from "./ws"
import RouteHTTP from "./http"
import RouteDefaultHeaders from "./defaultHeaders"

export default class RouteFile<GlobContext extends Record<any, any>, Middlewares extends MiddlewareInitted[]> {
	private routes: HTTP[] = []
	private webSockets: WebSocket[] = []
	private headers: Record<string, Content> = {}
	private parsedHeaders: Record<string, Buffer> = {}
	private validations: RoutedValidation[] = []
	private externals: ExternalRouter[] = []
	private hasCalledGet = false

	/**
	 * Create a new Route File
	 * @example
	 * ```
   * // routes/say.js
	 * module.exports = new controller.routeFile((file) => file
	 *   .http('GET', '/say/<text>', (http) => http
	 *     .onRequest((ctr) => {
	 *       ctr.print(ctr.params.get('text'))
	 *     })
	 *   )
	 * )
	 * 
   * // index.js
   * const controller = new Server({ })
   * 
   * controller.path('/', (path) => path
	 *   .loadCJS('./routes')
	 * )
   * ```
	 * @since 6.0.0
	*/ constructor(
		/** The Code to handle the File */ code: (file: RouteFile<GlobContext, Middlewares>) => RouteFile<GlobContext, Middlewares>
	) {
		code(this)
	}

	/**
	 * Add a Validation
	 * @example
	 * ```
	 * // The /api route will automatically check for correct credentials
	 * // Obviously still putting the prefix (in this case / from the RoutePath in front)
	 * const controller = new Server({ })
	 * 
	 * module.exports = new controller.routeFile((file) => file
	 *   .validate(async(ctr) => {
	 *     if (!ctr.headers.has('Authorization')) return end(ctr.status(401).print('Unauthorized'))
	 *     if (ctr.headers.get('Authorization') !== 'key123 or db request ig') return end(ctr.status(401).print('Unauthorized'))
	 *   })
	 *   .redirect('/pics', 'https://google.com/search?q=devil')
	 * )
	 * ```
	 * @since 6.0.2
	*/ public validate<Context extends Record<any, any> = {}, Body = unknown>(
		/** The Function to Validate the Request */ code: RoutedValidation<GlobContext & Context, Body>
	): this {
		this.validations.push(code as any)

		return this
	}

	/**
	 * Add Default Headers
	 * @example
	 * ```
	 * module.exports = new controller.routeFile((file) => file
	 *   .defaultHeaders((dH) => dH
	 *     .add('X-Api-Version', '1.0.0')
	 *   )
	 * )
	 * ```
	 * @since 6.0.1
	*/ public defaultHeaders(
		/** The Code to handle the Headers */ code: (path: RouteDefaultHeaders) => RouteDefaultHeaders
	): this {
		const routeDefaultHeaders = new RouteDefaultHeaders()
		this.externals.push({ object: routeDefaultHeaders })

		code(routeDefaultHeaders)
		this.headers = Object.assign(this.headers, routeDefaultHeaders['defaultHeaders'])

		return this
	}

	/**
	 * Add a HTTP Route
	 * @example
	 * ```
	 * module.exports = new controller.routeFile((file) => file
	 *   .http('GET', '/hello', (ws) => ws
	 *     .onRequest(async(ctr) => {
	 *       ctr.print('Hello bro!')
	 *     })
	 *   )
	 * )
	 * ```
	 * @since 6.0.0
	*/ public http<Context extends Record<any, any> = {}, Body = unknown>(
		/** The Request Method */ method: HTTPMethods,
		/** The Path on which this will be available */ path: string,
		/** The Code to handle the HTTP Endpoint */ code: (path: RouteHTTP<GlobContext & Context, Body>) => RouteHTTP<GlobContext & Context, Body>
	): this {
		if (this.webSockets.some((obj) => (obj.path === parsePath(path)))) return this

		const routeHTTP = new RouteHTTP<Context, Body>(parsePath(path), method, this.validations, this.parsedHeaders)
		this.externals.push({ object: routeHTTP })
		code(routeHTTP)

		return this
	}

	/**
	 * Add a Websocket Route
	 * @example
	 * ```
	 * module.exports = new controller.routeFile((file) => file
	 *   .ws('/uptime', (ws) => ws
	 *     .onConnect(async(ctr) => {
	 *       console.log('Connected to ws!')
	 *     })
	 * 		.onMessage((ctr) => {
	 *      console.log('Received message', ctr.message)
	 *    })
	 *    .onClose((ctr) => {
	 *      console.log('Disconnected from ws!')
	 *    })
	 *   )
	 * )
	 * ```
	 * @since 6.0.0
	*/ public ws<Context extends Record<any, any> = {}, Message = unknown>(
		/** The Path on which this will be available */ path: string,
		/** The Code to handle the Socket */ code: (path: RouteWS<GlobContext & Context, Message>) => RouteWS<GlobContext & Context, Message>
	): this {
		if (this.webSockets.some((obj) => (obj.path === parsePath(path)))) return this

		const routeWS = new RouteWS<Context, Message>(parsePath(path), this.validations)
		this.externals.push({ object: routeWS })
		code(routeWS)

		return this
	}


	/**
	 * Internal Method for Generating Router Object
	 * @since 6.0.0
	*/ public async getData(prefix: string) {
		if (!this.hasCalledGet) for (const external of this.externals) {
			const result = await external.object.getData(external.addPrefix ?? '/')

			if ('routes' in result && result.routes.length > 0) this.routes.push(...addPrefixes(result.routes, 'path', 'pathArray' as any, prefix))
			if ('webSockets' in result && result.webSockets.length > 0) this.webSockets.push(...addPrefixes(result.webSockets, 'path', 'pathArray' as any, prefix))
			if ('defaultHeaders' in result) this.parsedHeaders = Object.assign(this.parsedHeaders, result.defaultHeaders)
		}

		this.hasCalledGet = true

		return {
			routes: this.routes, webSockets: this.webSockets
		}
	}
}