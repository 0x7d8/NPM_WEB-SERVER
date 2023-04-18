import { ExternalRouter, LoadPath, Routed, HTTPMethods, RoutedValidation } from "../../types/internal"
import Static from "../../types/static"
import HTTP from "../../types/http"
import WebSocket from "../../types/webSocket"
import { pathParser } from "../URLObject"
import { Content } from "../.."

import path from "path"
import fs from "fs"

import RouteWS from "./ws"
import RouteHTTP from "./http"
import RouteExternal from "./external"
import RouteDefaultHeaders from "./defaultHeaders"

export default class RoutePath {
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
		/** The Path of the Routes */ path: string,
		/** The Validations to add */ validations?: RoutedValidation[],
		/** The Headers to add */ headers?: Record<string, Content>
	) {
		this.httpPath = pathParser(path)
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
	*/ validate<Context extends Record<any, any> = {}, Body = unknown>(
		/** The Function to Validate the Request */ code: RoutedValidation<Context, Body>
	) {
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
	*/ http<Context extends Record<any, any> = {}, Body = unknown>(
    /** The Request Method */ method: HTTPMethods,
		/** The Path on which this will be available */ path: string,
		/** The Code to handle the Socket */ code: (path: RouteHTTP<Context, Body>) => RouteHTTP<Context, Body>
	) {
		if (this.webSockets.some((obj) => (obj.path === pathParser(path)))) return this
	
		const routeHTTP = new RouteHTTP<Context, Body>(pathParser([ this.httpPath, path ]), method, this.validations, this.parsedHeaders)
		this.externals.push({ object: routeHTTP })
		code(routeHTTP)
	
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
	*/ ws<Context extends Record<any, any> = {}, Message = unknown>(
		/** The Path on which this will be available */ path: string,
		/** The Code to handle the Socket */ code: (path: RouteWS<Context, Message>) => RouteWS<Context, Message>
	) {
		if (this.webSockets.some((obj) => (obj.path === pathParser(path)))) return this

		const routeWS = new RouteWS<Context, Message>(pathParser([ this.httpPath, path ]), this.validations)
		this.externals.push({ object: routeWS })
		code(routeWS)

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
	*/ redirect(
		/** The Request Path to Trigger the Redirect on */ request: string,
		/** The Redirect Path to Redirect to */ redirect: string
	) {
		this.routes.push({
			type: 'route',
			method: 'GET',
			path: pathParser(this.httpPath + request),
			pathArray: pathParser(this.httpPath + request).split('/'),
			onRequest: (ctr) => ctr.redirect(redirect),
			data: {
				validations: this.validations,
				headers: this.parsedHeaders
			}
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
	*/ static(
		/** The Folder which will be used */ folder: string,
		/** Additional Configuration for Serving */ options: {
			/**
			 * Whether to automatically add Content-Type to some file endings
			 * @default true
			 * @since 3.1.0
			*/ addTypes?: boolean
			/**
			 * Whether to automatically remove .html ending from files
			 * @default false
			 * @since 3.1.0
			*/ hideHTML?: boolean
		} = {}
	) {
		const addTypes = options?.addTypes ?? true
		const hideHTML = options?.hideHTML ?? false

		this.statics.push({
			type: 'static',
			path: pathParser(this.httpPath),
			location: folder,
			data: {
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
	*/ loadCJS(
		/** The Folder which will be used */ folder: string
	) {
		if (!fs.existsSync(path.resolve(folder))) throw Error('The CJS Function folder wasnt found!')

		this.loadPaths.push({
			path: path.resolve(folder),
			prefix: this.httpPath,
			type: 'cjs',
			validations: this.validations,
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
	*/ loadESM(
		/** The Folder which will be used */ folder: string
	) {
		if (!fs.existsSync(path.resolve(folder))) throw Error('The ESM Function folder wasnt found!')

		this.loadPaths.push({
			path: path.resolve(folder),
			prefix: this.httpPath,
			type: 'esm',
			validations: this.validations,
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
	 *   .http('GET', '/cool', (ctr) => {
	 *     ctr.print('cool!')
	 *   })
	 *   .path('/api', (path) => path
	 *     .http('GET', '/', (ctr) => {
	 *       ctr.print('Welcome to the API')
	 *     })
	 *   )
	 * )
	 * ```
	 * @since 5.0.0
	*/ path(
		/** The Path Prefix */ prefix: string,
		/** The Code to handle the Prefix */ router: ((path: RoutePath) => RoutePath) | RoutePath | RouteExternal
	) {
		if ('getData' in router) {
			this.externals.push({ object: router, addPrefix: pathParser([ this.httpPath, prefix ]) })
		} else {
			const routePath = new RoutePath(pathParser([ this.httpPath, prefix ]), [...this.validations], Object.assign({}, this.headers))
			this.externals.push({ object: routePath })
			router(routePath)
		}

		return this
	}


	/**
	 * Internal Method for Generating Routes Object
	 * @since 6.0.0
	*/ async getData() {
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