import { ExternalRouter, LoadPath, HTTPMethods, RoutedValidation, MiddlewareInitted, ExcludeFrom } from "../../types/internal"
import DocumentationBuilder from "../documentation/builder"
import Static from "../../types/static"
import HTTP from "../../types/http"
import WebSocket from "../../types/webSocket"
import RPath from "../path"
import { isRegExp } from "util/types"
import parsePath from "../../functions/parsePath"
import { Content } from "../.."

import path from "path"
import fs from "fs"

import RouteWS from "./ws"
import RouteHTTP from "./http"
import RouteDefaultHeaders from "./defaultHeaders"
import RouteRateLimit from "./rateLimit"
import { as } from "rjutils-collection"

export default class RoutePath<GlobContext extends Record<any, any>, Middlewares extends MiddlewareInitted[] = [], Path extends string = '/', Excluded extends (keyof RoutePath<GlobContext, Middlewares, Path>)[] = []> {
	private externals: ExternalRouter[]
	private validations: RoutedValidation[]
	private headers: Record<string, Content>
	private parsedHeaders: Record<string, Buffer>
	private httpratelimit: RouteRateLimit['data']
	private wsratelimit: RouteRateLimit['data']
	private loadPaths: LoadPath[]
	private statics: Static[]
	private routes: HTTP[]
	private webSockets: WebSocket[]
	private httpPath: string
	private hasCalledGet = false

	/** Generate Route Block */
	constructor(
		/** The Path of the Routes */ path: Path,
		/** The Validations to add */ validations?: RoutedValidation[],
		/** The Headers to add */ headers?: Record<string, Content>,
		/** The HTTP Ratelimit to add */ httpRatelimit?: RouteRateLimit['data'],
		/** The WS Ratelimit to add */ wsRatelimit?: RouteRateLimit['data']
	) {
		this.httpPath = parsePath(path)
		this.routes = []
		this.statics = []
		this.webSockets = []
		this.loadPaths = []
		this.parsedHeaders = {}

		this.httpratelimit = httpRatelimit ?? new RouteRateLimit()['data']
		this.wsratelimit = wsRatelimit ?? new RouteRateLimit()['data']

		this.validations = validations || []
		this.headers = headers || {}
		this.externals = []

		if (Object.keys(this.headers).length > 0) {
			const routeDefaultHeaders = new RouteDefaultHeaders()
			this.externals.push({ object: routeDefaultHeaders })

			for (const [ key, value ] of Object.entries(this.headers)) {
				routeDefaultHeaders.add(key as any, value)
			}
		}
	}

	/**
	 * Add a Validation
	 * @example
	 * ```
	 * // The /api route will automatically check for correct credentials
	 * // Obviously still putting the prefix (in this case / from the RoutePath in front)
	 * const controller = new Server({ })
	 * 
	 * controller.path('/api', (path) => path
	 *   .validate(async(ctr, end) => {
	 *     if (!ctr.headers.has('Authorization')) return end(ctr.status(401).print('Unauthorized'))
	 *     if (ctr.headers.get('Authorization') !== 'key123 or db request ig') return end(ctr.status(401).print('Unauthorized'))
	 *   })
	 *   .redirect('/pics', 'https://google.com/search?q=devil')
	 * )
	 * ```
	 * @since 3.2.1
	*/ public validate<Context extends Record<any, any> = {}, Body = unknown>(
		/** The Callback to Validate the Request */ callback: RoutedValidation<GlobContext & Context, Body, Middlewares, Path>
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
	*/ public httpRatelimit(
		callback: (limit: RouteRateLimit) => any
	): ExcludeFrom<RoutePath<GlobContext, Middlewares, Path, [...Excluded, 'httpRatelimit']>, [...Excluded, 'httpRatelimit']> {
		const limit = new RouteRateLimit()
		limit['data'] = Object.assign({}, this.httpratelimit)

		callback(limit)

		this.httpratelimit = limit['data']

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
	*/ public wsRatelimit(
		callback: (limit: RouteRateLimit) => any
	): ExcludeFrom<RoutePath<GlobContext, Middlewares, Path, [...Excluded, 'wsRatelimit']>, [...Excluded, 'wsRatelimit']> {
		const limit = new RouteRateLimit()
		limit['data'] = Object.assign({}, this.wsratelimit)

		callback(limit)

		this.wsratelimit = limit['data']

		return as<any>(this)
	}

	/**
	 * Add a HTTP Route
	 * @example
	 * ```
	 * controller.path('/', (path) => path
	 *   .http('GET', '/hello', (ws) => ws
	 *     .onRequest(async(ctr) => {
	 *       ctr.print('Hello bro!')
	 *     })
	 *   )
	 * )
	 * ```
	 * @since 6.0.0
	*/ public http<Context extends Record<any, any> = {}, Body = unknown, LPath extends string = '/'>(
    /** The Request Method */ method: HTTPMethods,
		/** The Path on which this will be available */ path: LPath | RegExp,
		/** The Callback to handle the Endpoint */ callback: (path: RouteHTTP<GlobContext, Context, Body, Middlewares, `${Path}/${LPath}`>) => any
	): this {
		if (this.routes.some((obj) => isRegExp(obj.path) ? false : obj.path.path === parsePath(path as string))) return this
	
		const routeHTTP = new RouteHTTP<GlobContext, Context, Body, Middlewares, `${Path}/${LPath}`>(path as any, method, this.validations, this.parsedHeaders, this.httpratelimit)
		this.externals.push({ object: routeHTTP, addPrefix: this.httpPath })
		callback(routeHTTP)
	
		return this
	}

	/**
	 * Add a Websocket Route
	 * @example
	 * ```
	 * controller.path('/', (path) => path
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
	*/ public ws<Context extends Record<any, any> = {}, Message = unknown, LPath extends string = '/'>(
		/** The Path on which this will be available */ path: LPath | RegExp,
		/** The Callback to handle the Endpoint */ callback: (path: RouteWS<GlobContext, Context, Message, Middlewares, `${Path}/${LPath}`>) => any
	): this {
		if (this.webSockets.some((obj) => isRegExp(obj.path) ? false : obj.path.path === parsePath(path as string))) return this

		const routeWS = new RouteWS<GlobContext, Context, Message, Middlewares, `${Path}/${LPath}`>(path as any, this.validations, this.parsedHeaders, this.wsratelimit)
		this.externals.push({ object: routeWS, addPrefix: this.httpPath })
		callback(routeWS)

		return this
	}

	/**
	 * Add Default Headers
	 * @example
	 * ```
	 * controller.path('/', (path) => path
	 *   .defaultHeaders((dH) => dH
	 *     .add('X-Api-Version', '1.0.0')
	 *     .add('Copyright', () => new Date().getYear())
	 *   )
	 * )
	 * ```
	 * @since 6.0.0
	*/ public defaultHeaders(
		/** The Callback to handle the Headers */ callback: (path: RouteDefaultHeaders) => RouteDefaultHeaders
	): this {
		const routeDefaultHeaders = new RouteDefaultHeaders()
		this.externals.push({ object: routeDefaultHeaders })

		callback(routeDefaultHeaders)
		this.headers = Object.assign(this.headers, routeDefaultHeaders['defaultHeaders'])

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
	 * @since 3.1.0
	*/ public redirect(
		/** The Request Path to Trigger the Redirect on */ request: string,
		/** The Redirect Path to Redirect to */ redirect: string
	): this {
		this.routes.push({
			type: 'http',
			method: 'GET',
			path: new RPath('GET', parsePath([ this.httpPath, request ])),
			documentation: new DocumentationBuilder(),
			onRequest: (ctr) => ctr.redirect(redirect),
			data: {
				ratelimit: { maxHits: Infinity, penalty: 0, sortTo: -1, timeWindow: Infinity },
				validations: this.validations,
				headers: this.parsedHeaders
			}, context: { data: {}, keep: true }
		})

		return this
	}

	/**
	 * Serve Static Files
	 * @example
	 * ```
	 * // All Files in "./static" will be served dynamically so they wont be loaded as routes by default
	 * // Due to the hideHTML Option being on files will be served differently, /index.html -> /; /about.html -> /about; /contributors/index.html -> /contributors
	 * const controller = new Server({ })
	 * 
	 * controller.path('/', (path) => path
	 *   .static('./static', {
	 *     hideHTML: true, // If enabled will remove .html ending from files
	 *     addTypes: true, // If enabled will automatically add content-types to some file endings (including the custom ones defined in the main config)
	 *   })
	 * )
	 * ```
	 * @since 3.1.0
	*/ public static(
		/** The Folder which will be used */ folder: string,
		/** Additional Configuration for Serving */ options: {
			/**
			 * Whether to automatically add Content-Type to some file endings
			 * @default true
			 * @since 3.1.0
			*/ addTypes?: boolean
			/**
			 * Whether to compress files when sending
			 * @default true
			 * @since 7.10.0
			*/ compress?: boolean
			/**
			 * Whether to automatically remove .html ending from files
			 * @default false
			 * @since 3.1.0
			*/ hideHTML?: boolean
		} = {}
	): this {
		const addTypes = options?.addTypes ?? true
		const compress = options?.compress ?? true
		const hideHTML = options?.hideHTML ?? false

		this.statics.push({
			type: 'static',
			path: new RPath('GET', parsePath(this.httpPath)),
			location: folder,
			data: {
				doCompress: compress,
				addTypes, hideHTML,
				validations: this.validations,
				headers: this.parsedHeaders
			}
		})

		return this
	}

	/**
	 * Load CJS Route Files
	 * @example
	 * ```
	 * // All Files in "./routes" ending with .js will be loaded as routes
	 * const controller = new Server({ })
	 * 
	 * controller.path('/', (path) => path
	 *   .loadCJS('./routes')
	 * )
	 * ```
	 * @since 3.1.0
	*/ public loadCJS(
		/** The Folder which will be used */ folder: string,
		/** The Options */ options: {
			/**
			 * Whether to enable file based routing, works similarly to static file hideHTML
			 * @default false
			 * @since 7.5.0
			*/ fileBasedRouting?: boolean
		} = {}
	): this {
		const fileBasedRouting = options?.fileBasedRouting ?? false

		if (!fs.existsSync(path.resolve(folder))) throw Error('The CJS Function folder wasnt found!')

		this.loadPaths.push({
			path: path.resolve(folder),
			prefix: this.httpPath,
			type: 'cjs',
			httpRatelimit: this.httpratelimit,
			wsRatelimit: this.wsratelimit,
			validations: this.validations,
			fileBasedRouting,
			headers: this.parsedHeaders
		})

		return this
	}

	/**
	 * Load ESM Route Files
	 * @example
	 * ```
	 * // All Files in "./routes" ending with .js will be loaded as routes
	 * const controller = new Server({ })
	 * 
	 * controller.path('/', (path) => path
	 *   .loadESM('./routes')
	 * )
	 * ```
	 * @since 4.0.0
	*/ public loadESM(
		/** The Folder which will be used */ folder: string,
		/** The Options */ options: {
			/**
			 * Whether to enable file based routing, works similarly to static file hideHTML
			 * @default false
			 * @since 7.5.0
			*/ fileBasedRouting?: boolean
		} = {}
	): this {
		const fileBasedRouting = options?.fileBasedRouting ?? false

		if (!fs.existsSync(path.resolve(folder))) throw Error('The ESM Function folder wasnt found!')

		this.loadPaths.push({
			path: path.resolve(folder),
			prefix: this.httpPath,
			type: 'esm',
			httpRatelimit: this.httpratelimit,
			wsRatelimit: this.wsratelimit,
			validations: this.validations,
			fileBasedRouting,
			headers: this.parsedHeaders
		})

		return this
	}

	/**
	 * Add a new Block of Routes with a Prefix
	 * @example
	 * ```
	 * const controller = new Server({ })
	 * 
	 * controller.path('/', (path) => path
	 *   .http('GET', '/cool', (http) => http
	 *     .onRequest((ctr) => {
	 *       ctr.print('cool!')
	 *     })
	 *   )
	 *   .path('/api', (path) => path
	 *     .context({
	 *       version: '1.0.0'
	 *     })
	 *     .http('GET', '/', (http) => http
	 *       .onRequest((ctr) => {
	 *         ctr.print(`Welcome to the API!, Version ${ctr["@"].version}`)
	 *       })
	 *     )
	 *   )
	 * )
	 * ```
	 * @since 5.0.0
	*/ public path<LPath extends string = `/${string}`>(
		/** The Path Prefix */ prefix: LPath,
		/** The Callback to handle the Prefix */ router: ((path: RoutePath<GlobContext, Middlewares, `${Path}/${LPath}`>) => any) | RoutePath<any, any>
	): this {
		if ('getData' in router) {
			this.externals.push({ object: router, addPrefix: parsePath([ this.httpPath, prefix ]) })
		} else {
			const routePath = new RoutePath<GlobContext, Middlewares, `${Path}/${LPath}`>(parsePath([ this.httpPath, prefix ]) as any, [...this.validations], Object.assign({}, this.headers), Object.assign({}, this.httpratelimit), Object.assign({}, this.wsratelimit))
			this.externals.push({ object: routePath as any })
			router(routePath)
		}

		return this
	}


	/**
	 * Internal Method for Generating Routes Object
	 * @since 6.0.0
	*/ public async getData() {
		if (!this.hasCalledGet) for (const external of this.externals) {
			const result = await external.object.getData(external.addPrefix ?? '/')

			if ('routes' in result && result.routes.length > 0) this.routes.push(...result.routes)
			if ('webSockets' in result && result.webSockets.length > 0) this.webSockets.push(...result.webSockets)
			if ('statics' in result && result.statics.length > 0) this.statics.push(...result.statics)
			if ('loadPaths' in result && result.loadPaths.length > 0) this.loadPaths.push(...result.loadPaths)
			if ('defaultHeaders' in result) this.parsedHeaders = Object.assign(this.parsedHeaders, result.defaultHeaders)
		}

		this.hasCalledGet = true

		return {
			routes: this.routes, webSockets: this.webSockets,
			statics: this.statics, loadPaths: this.loadPaths
		}
	}
}