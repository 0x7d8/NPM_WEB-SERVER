import WebSocket from "../../types/webSocket"
import HTTP from "../../types/http"
import { ExcludeFrom, ExternalRouter, HTTPMethod, MiddlewareInitted, RoutedValidation, ExcludeIf } from "../../types/internal"
import { as, zValidate } from "rjutils-collection"
import { isRegExp } from "util/types"
import { Content } from "../../functions/parseContent"
import RPath from "../path"
import methods from "../../misc/methods"
import parsePath from "../../functions/parsePath"

import RouteWS from "./ws"
import RouteHTTP from "./http"
import RouteDefaultHeaders from "./defaultHeaders"
import RouteRateLimit from "./rateLimit"
import DocumentationBuilder from "../documentation/builder"

export default class RouteFile<GlobContext extends Record<any, any>, Middlewares extends MiddlewareInitted[], Excluded extends (keyof RouteFile<GlobContext, Middlewares>)[] = []> {
	private routes: HTTP[] = []
	private webSockets: WebSocket[] = []
	private headers: Record<string, Content> = {}
	private parsedHeaders: Record<string, Buffer> = {}
	private httpratelimit: RouteRateLimit['data'] = new RouteRateLimit()['data']
	private wsratelimit: RouteRateLimit['data'] = new RouteRateLimit()['data']
	private validations: RoutedValidation[] = []
	private externals: ExternalRouter[] = []
	private hasSetHTTPLimit = false
	private hasSetWSLimit = false
	private hasCalledGet = false

	/**
	 * Create a new Route File
	 * @example
	 * ```
   * // routes/say.js
	 * const controller = require('../index.js')
	 * 
	 * module.exports = new controller.routeFile((file) => file
	 *   .http('GET', '/say/{text}', (http) => http
	 *     .onRequest((ctr) => {
	 *       ctr.print(ctr.params.get('text'))
	 *     })
	 *   )
	 * )
	 * 
   * // index.js
   * const controller = new Server({ })
	 * 
	 * module.exports = controller
   * 
   * controller.path('/', (path) => path
	 *   .loadCJS('./routes')
	 * )
   * ```
	 * @since 6.0.0
	*/ constructor(
		/** The Callback to handle the File */ callback: (file: RouteFile<GlobContext, Middlewares>) => any
	) {
		callback(this as any)
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
	*/ @zValidate([ (z) => z.function() ])
	public validate<Context extends Record<any, any> = {}, Body = unknown>(
		/** The Callback to Validate the Request */ callback: RoutedValidation<GlobContext & Context, Body>
	): this {
		this.validations.push(callback as any)

		return this
	}

	/**
	 * Add a Ratelimit to all HTTP Endpoints in this Path (and all children)
	 * 
	 * When a User requests an Endpoint, that will count against their hit count, if
	 * the hits exceeds the `<maxHits>` in `<timeWindow>ms`, they wont be able to access
	 * the route for `<penalty>ms`.
	 * @example
	 * ```
	 * const { time } = require("rjutils-collection")
	 * 
	 * controller.path('/', (path) => path
	 *   .httpRateLimit((limit) => limit
	 *     .hits(5)
	 *     .window(time(20).s())
	 *     .penalty(0)
	 *   ) // This will allow 5 requests every 20 seconds
	 *   .http('GET', '/hello', (ws) => ws
	 *     .onRequest(async(ctr) => {
	 *       ctr.print('Hello bro!')
	 *     })
	 *   )
	 * )
	 * 
	 * controller.on('httpRatelimit', (ctr) => {
	 *   ctr.print(`Please wait ${ctr.getRateLimit()?.resetIn}ms!!!!!`)
	 * })
	 * ```
	 * @since 8.6.0
	*/ @zValidate([ (z) => z.function() ])
	public httpRatelimit(
		callback: (limit: RouteRateLimit) => any
	): ExcludeFrom<RouteFile<GlobContext, Middlewares, [...Excluded, 'httpRatelimit']>, [...Excluded, 'httpRatelimit']> {
		const limit = new RouteRateLimit()
		limit['data'] = Object.assign({}, this.httpratelimit)

		callback(limit)

		this.httpratelimit = limit['data']
		this.hasSetHTTPLimit = true

		return as<any>(this)
	}

	/**
	 * Add a Ratelimit to all WebSocket Endpoints in this Path (and all children)
	 * 
	 * When a User sends a message to a Socket, that will count against their hit count, if
	 * the hits exceeds the `<maxHits>` in `<timeWindow>ms`, they wont be able to access
	 * the route for `<penalty>ms`.
	 * @example
	 * ```
	 * const { time } = require("rjutils-collection")
	 * 
	 * controller.path('/', (path) => path
	 *   .httpRateLimit((limit) => limit
	 *     .hits(5)
	 *     .window(time(20).s())
	 *     .penalty(0)
	 *   ) // This will allow 5 messages every 20 seconds
	 *   .ws('/echo', (ws) => ws
	 *     .onMessage(async(ctr) => {
	 *       ctr.print(ctr.rawBodyBytes)
	 *     })
	 *   )
	 * )
	 * 
	 * controller.on('wsMessageRatelimit', (ctr) => {
	 *   ctr.print(`Please wait ${ctr.getRateLimit()?.resetIn}ms!!!!!`)
	 * })
	 * ```
	 * @since 8.6.0
	*/ @zValidate([ (z) => z.function() ])
	public wsRatelimit(
		callback: (limit: RouteRateLimit) => any
	): ExcludeFrom<RouteFile<GlobContext, Middlewares, [...Excluded, 'wsRatelimit']>, [...Excluded, 'wsRatelimit']> {
		const limit = new RouteRateLimit()
		limit['data'] = Object.assign({}, this.wsratelimit)

		callback(limit)

		this.wsratelimit = limit['data']
		this.hasSetWSLimit = true

		return as<any>(this)
	}

	/**
	 * Add Default Headers
	 * @example
	 * ```
	 * module.exports = new controller.routeFile((file) => file
	 *   .defaultHeaders((dH) => dH
	 *     .add('X-Api-Version', '1.0.0')
	 *     .add('Copyright', () => new Date().getYear())
	 *   )
	 * )
	 * ```
	 * @since 6.0.1
	*/ @zValidate([ (z) => z.function() ])
	public defaultHeaders(
		/** The Callback to handle the Headers */ callback: (path: RouteDefaultHeaders) => RouteDefaultHeaders
	): this {
		const routeDefaultHeaders = new RouteDefaultHeaders()
		this.externals.push({ object: routeDefaultHeaders })

		callback(routeDefaultHeaders)
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
	*/ @zValidate([ (z) => z.string().refine((s) => methods.includes(s as any)), (z) => z.union([ z.string(), z.instanceof(RegExp) ]), (z) => z.function() ])
	public http<Context extends Record<any, any> = {}, Body = unknown, Path extends string = '/', Method extends HTTPMethod = 'GET'>(
    /** The Request Method */ method: Method,
		/** The Path on which this will be available */ path: Path | RegExp,
		/** The Callback to handle the Endpoint */ callback: (path: ExcludeIf<Method extends 'GET' ? true : false, RouteHTTP<GlobContext, Context, Body, Middlewares, Path, Method, Method extends 'GET' ? ['onRawBody'] : []>, 'onRawBody'>) => any
	): this {
		if (this.routes.some((obj) => isRegExp(obj.path) ? false : obj.path.path === parsePath(path as string))) return this

		const routeHTTP = new RouteHTTP<GlobContext, Context, Body, Middlewares, Path, Method, Method extends 'GET' ? ['onRawBody'] : []>(path as any, method, this.validations, this.parsedHeaders, this.httpratelimit)
		this.externals.push({ object: routeHTTP })
		callback(routeHTTP)

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
	 * @since 5.4.0
	*/ @zValidate([ (z) => z.union([ z.string(), z.instanceof(RegExp) ]), (z) => z.function() ])
	public ws<Context extends Record<any, any> = {}, Message = unknown, Path extends string = '/'>(
		/** The Path on which this will be available */ path: Path | RegExp,
		/** The Callback to handle the Endpoint */ callback: (path: RouteWS<GlobContext, Context, Message, Middlewares, Path>) => any
	): this {
		if (this.webSockets.some((obj) => isRegExp(obj.path) ? false : obj.path.path === parsePath(path as string))) return this

		const routeWS = new RouteWS<GlobContext, Context, Message, Middlewares, Path>(path as any, this.validations, this.parsedHeaders, this.wsratelimit)
		this.externals.push({ object: routeWS })
		callback(routeWS)

		return this
	}

	/**
	 * Add a Redirect
	 * @example
	 * ```
	 * // The /devil route will automatically redirect to google.com
	 * // Obviously still putting the prefix (in this case / from the RoutePath in front)
	 * const controller = new Server({ })
	 * 
	 * controller.path('/', (path) => path
	 *   .redirect('/devil', 'https://google.com')
	 *   .redirect('/devilpics', 'https://google.com/search?q=devil')
	 * )
	 * ```
	 * @since 8.8.6
	*/ @zValidate([ (z) => z.string(), (z) => z.string(), (z) => z.union([ z.literal('temporary'), z.literal('permanent').optional() ]) ])
	public redirect(
		/** The Request Path to Trigger the Redirect on */ request: string,
		/** The Redirect Path to Redirect to */ redirect: string,
		/** The Redirect Type */ type?: 'temporary' | 'permanent'
	): this {
		this.routes.push({
			type: 'http',
			method: 'GET',
			path: new RPath('GET', parsePath(request)),
			documentation: new DocumentationBuilder(),
			onRequest: (ctr) => ctr.redirect(redirect, type),
			data: {
				ratelimit: { maxHits: Infinity, penalty: 0, sortTo: -1, timeWindow: Infinity },
				validations: this.validations,
				headers: this.parsedHeaders
			}, context: { data: {}, keep: true }
		})

		return this
	}


	/**
	 * Internal Method for Generating Router Object
	 * @since 6.0.0
	*/ public async getData(prefix: string, httpRatelimit: RouteRateLimit['data'], wsRatelimit: RouteRateLimit['data']) {
		if (!this.hasCalledGet) for (const external of this.externals) {
			const result = await external.object.getData(external.addPrefix ?? '/')

			if (!this.hasSetHTTPLimit) Object.assign(this.httpratelimit, httpRatelimit)
			if (!this.hasSetWSLimit) Object.assign(this.wsratelimit, wsRatelimit)

			if ('routes' in result && result.routes.length > 0) this.routes.push(...result.routes.map((r) => { r.path.addPrefix(prefix); return r }))
			if ('webSockets' in result && result.webSockets.length > 0) this.webSockets.push(...result.webSockets.map((r) => { r.path.addPrefix(prefix); return r }))
			if ('defaultHeaders' in result) this.parsedHeaders = Object.assign(this.parsedHeaders, result.defaultHeaders)
		}

		this.hasCalledGet = true

		return {
			routes: this.routes, webSockets: this.webSockets
		}
	}
}