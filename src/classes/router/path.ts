import { ExternalRouter, LoadPath, HTTPMethods, RoutedValidation, MiddlewareInitted } from "../../types/internal"
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

/// TODO: Maybe Finish
//export class BasePath<PathContext extends Record<any, any>, GlobContext extends Record<any, any>, Middlewares extends MiddlewareInitted[] = [], Path extends string = '/'> {
//	private contexts: HTTP['context']
//	private validations: RoutedValidation[]
//	private headers: Record<string, Content>
//	private httpPath: string
//
//	/**
//	 * Generate a Base Route Block
//	 * @since 8.2.0
//	*/ constructor(
//		/** The Path of the Routes */ path: Path,
//		/** The Validations to add */ validations?: RoutedValidation[],
//		/** The Headers to add */ headers?: Record<string, Content>,
//		/** The Contexts to add */ contexts?: HTTP['context']
//	) {
//		this.httpPath = path
//		this.validations = validations || []
//		this.headers = headers || {}
//		this.contexts = contexts || []
//	}
//
//	/**
//	 * Add a default State for the Request Context (which stays for the entire requests lifecycle)
//	 * 
//	 * This will set the default context for the request. This applies to all callbacks
//	 * attached to this handler. When `keepForever` is enabled, the context will be shared
//	 * between requests to this callback and therefore will be globally mutable. This may be
//	 * useful for something like a request counter so you dont have to worry about transferring
//	 * it around.
//	 * 
//	 * This method is required to generate the full path context.
//	 * @example
//	 * ```
//	 * const controller = new Server({ })
//	 * 
//	 * controller.path('/', (path) => path
//	 *   .context({
//	 *     text: 'hello world'
//	 *   }, {
//	 *     keepForever: true // If enabled this Context will be used & kept for every request on this router, so if you change something in it it will stay for the next time this request runs
//	 *   })
//	 *   .http('GET', '/context', (ws) => ws
//	 *     .onRequest((ctr) => {
//	 *       ctr.print(ctr["@"].text)
//	 *     })
//	 *   )
//	 * )
//	 * ```
//	 * @since 8.2.0
//	*/ public context<Context extends Record<any, any>>(
//		/** The Default State of the Request Context */ context: PathContext extends Record<any, Reserved> ? Context : PathContext,
//		/** The Options for this Function */ options: {
//			/**
//			 * Whether to keep the Data for the entirety of the Processes Lifetime
//			 * @default false
//			 * @since 7.0.0
//			*/ keepForever?: boolean
//		} = {}
//	): RoutePath<PathContext extends Record<any, Reserved> ? Context : PathContext, GlobContext, Middlewares, Path> {
//		const keepForever = options?.keepForever ?? false
//
//		this.contexts.push({
//			data: context,
//			keep: keepForever
//		})
//
//		return new RoutePath<PathContext extends Record<any, Reserved> ? Context : PathContext, GlobContext, Middlewares, any>(this.httpPath, this.validations, this.headers, this.contexts)
//	}
//}

export default class RoutePath<GlobContext extends Record<any, any>, Middlewares extends MiddlewareInitted[] = [], Path extends string = '/'> {
	private externals: ExternalRouter[]
	private validations: RoutedValidation[]
	private headers: Record<string, Content>
	private parsedHeaders: Record<string, Buffer>
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
		/** The Contexts to add */ contexts?: HTTP['context']
	) {
		this.httpPath = parsePath(path)
		this.routes = []
		this.statics = []
		this.webSockets = []
		this.loadPaths = []
		this.parsedHeaders = {}

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
		/** The Function to Validate the Request */ code: RoutedValidation<GlobContext & Context, Body, Middlewares, Path>
	): this {
		this.validations.push(code as any)

		return this
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
		/** The Callback to handle the Endpoint */ callback: (path: RouteHTTP<GlobContext, Context, Body, Middlewares, `${Path}/${LPath}`>) => RouteHTTP<GlobContext, Context, Body, Middlewares, `${Path}/${LPath}`>
	): this {
		if (this.routes.some((obj) => isRegExp(obj.path) ? false : obj.path.path === parsePath(path as string))) return this
	
		const routeHTTP = new RouteHTTP<GlobContext, Context, Body, Middlewares, `${Path}/${LPath}`>(path as any, method, this.validations, this.parsedHeaders)
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
		/** The Callback to handle the Endpoint */ callback: (path: RouteWS<GlobContext, Context, Message, Middlewares, `${Path}/${LPath}`>) => RouteWS<GlobContext, Context, Message, Middlewares, `${Path}/${LPath}`>
	): this {
		if (this.webSockets.some((obj) => isRegExp(obj.path) ? false : obj.path.path === parsePath(path as string))) return this

		const routeWS = new RouteWS<GlobContext, Context, Message, Middlewares, `${Path}/${LPath}`>(path as any, this.validations, this.parsedHeaders)
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
			onRequest: (ctr) => ctr.redirect(redirect),
			data: {
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
		/** The Callback to handle the Prefix */ router: ((path: RoutePath<GlobContext, Middlewares, `${Path}/${LPath}`>) => RoutePath<GlobContext, Middlewares, `${Path}/${LPath}`>) | RoutePath<any, any>
	): this {
		if ('getData' in router) {
			this.externals.push({ object: router, addPrefix: parsePath([ this.httpPath, prefix ]) })
		} else {
			const routePath = new RoutePath<GlobContext, Middlewares, `${Path}/${LPath}`>(parsePath([ this.httpPath, prefix ]) as any, [...this.validations], Object.assign({}, this.headers))
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

			console.dir(result, { depth: null })

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