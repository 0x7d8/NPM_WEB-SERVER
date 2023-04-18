import WebSocket from "../types/webSocket"
import HTTP from "../types/http"
import { ExternalRouter, HTTPMethods, RoutedValidation } from "../types/internal"
import addPrefixes from "../functions/addPrefixes"
import { Content } from "../functions/parseContent"
import { pathParser } from "./URLObject"

import RouteWS from "./router/ws"
import RouteHTTP from "./router/http"
import RouteDefaultHeaders from "./router/defaultHeaders"

export default class RouteFileBuilder {
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
	 * module.exports = new RouteFile((file) => file
	 *   .http('GET', '/say/<text>', (http) => http
	 *     .onRequest((ctr) => {
	 *       ctr.print(ctr.params.get('text'))
	 *     })
	 *   )
	 * )
	 * ```
   * 
   * ```
   * // index.js
   * const controller = new Server({ })
   * 
   * controller.path('/', (path) => path
	 *   .loadCJS('./routes')
	 * )
   * ```
	 * @since 6.0.0
	*/ constructor(
		/** The Code to handle the File */ code: (file: RouteFileBuilder) => RouteFileBuilder
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
	 * module.exports = new RouteFile((file) => file
	 *   .validate(async(ctr) => {
	 *     if (!ctr.headers.has('Authorization')) return end(ctr.status(401).print('Unauthorized'))
	 *     if (ctr.headers.get('Authorization') !== 'key123 or db request ig') return end(ctr.status(401).print('Unauthorized'))
	 *   })
	 *   .redirect('/pics', 'https://google.com/search?q=devil')
	 * )
	 * ```
	 * @since 6.0.2
	*/ validate<Context extends Record<any, any> = {}, Body = unknown>(
		/** The Function to Validate the Request */ code: RoutedValidation<Context, Body>
	) {
		this.validations.push(code as any)

		return this
	}

	/**
	 * Add Default Headers
	 * @example
	 * ```
	 * module.exports = new RouteFile((file) => file
	 *   .defaultHeaders((dH) => dH
	 *     .add('X-Api-Version', '1.0.0')
	 *   )
	 * )
	 * ```
	 * @since 6.0.1
	*/ defaultHeaders(
		/** The Code to handle the Headers */ code: (path: RouteDefaultHeaders) => RouteDefaultHeaders
	) {
		const routeDefaultHeaders = new RouteDefaultHeaders()
		this.externals.push({ object: routeDefaultHeaders })

		code(routeDefaultHeaders)
		this.headers = { ...this.headers, ...(routeDefaultHeaders as any).defaultHeaders }

		return this
	}

	/**
	 * Add a HTTP Route
	 * @example
	 * ```
	 * module.exports = new RouteFile((file) => file
	 *   .http('GET', '/hello', (ws) => ws
	 *     .onRequest(async(ctr) => {
	 *       ctr.print('Hello bro!')
	 *     })
	 *   )
	 * )
	 * ```
	 * @since 6.0.0
	*/ http<Context extends Record<any, any> = {}, Body = unknown>(
		/** The Request Method */ method: HTTPMethods,
		/** The Path on which this will be available */ path: string,
		/** The Code to handle the HTTP Endpoint */ code: (path: RouteHTTP<Context, Body>) => RouteHTTP<Context, Body>
	) {
		if (this.webSockets.some((obj) => (obj.path === pathParser(path)))) return this

		const routeHTTP = new RouteHTTP<Context, Body>(pathParser(path), method, this.validations, this.parsedHeaders)
		this.externals.push({ object: routeHTTP })
		code(routeHTTP)

		return this
	}

	/**
	 * Add a Websocket Route
	 * @example
	 * ```
	 * module.exports = new RouteFile((file) => file
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
	*/ ws<Context extends Record<any, any> = {}, Message = unknown>(
		/** The Path on which this will be available */ path: string,
		/** The Code to handle the Socket */ code: (path: RouteWS<Context, Message>) => RouteWS<Context, Message>
	) {
		if (this.webSockets.some((obj) => (obj.path === pathParser(path)))) return this

		const routeWS = new RouteWS<Context, Message>(pathParser(path), this.validations)
		this.externals.push({ object: routeWS })
		code(routeWS)

		return this
	}


	/**
	 * Internal Method for Generating Headers Object
	 * @since 6.0.0
	*/ async getData(prefix: string) {
		if (!this.hasCalledGet) for (const external of this.externals) {
			const result = await external.object.getData(external.addPrefix ?? '/')

			if ('routes' in result && result.routes.length > 0) this.routes.push(...addPrefixes(result.routes, 'path', 'pathArray', prefix))
			if ('webSockets' in result && result.webSockets.length > 0) this.webSockets.push(...addPrefixes(result.webSockets, 'path', 'pathArray', prefix))
			if ('defaultHeaders' in result) this.parsedHeaders = Object.assign(this.parsedHeaders, result.defaultHeaders)
		}

		this.hasCalledGet = true

		return {
			routes: this.routes, webSockets: this.webSockets
		}
	}
}