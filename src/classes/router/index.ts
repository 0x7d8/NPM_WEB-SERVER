import { ExternalRouter, LoadPath } from "../../types/internal"
import { MiddlewareProduction } from "../../types/external"
import SafeServerEventEmitter from "../safeEventEmitter"
import Route from "../../types/route"
import Websocket from "../../types/webSocket"
import Static from "../../types/static"

import RoutePath from "./path"
import RouteExternal from "./external"
import RouteContentTypes from "./contentTypes"
import RouteDefaultHeaders from "./defaultHeaders"

export default class RouteList extends SafeServerEventEmitter {
	protected middlewares: ReturnType<MiddlewareProduction['init']>[]
	private externals: ExternalRouter[]

	/** List of Routes */
	constructor() {
		super()

		this.externals = []
		this.middlewares = []
	}

	/**
	 * Add a new Middleware
	 * @example
	 * ```
	 * // We will use the custom middleware
	 * const middleware = require('middleware-package')
	 * const controller = new Server({ })
	 * 
	 * controller.middleware(middleware())
	 * ```
	 * @since 4.4.0
	*/ middleware(
		/** The Middleware to run on a Request */ middleware: ReturnType<MiddlewareProduction['init']>
	) {
		this.middlewares.push(middleware)
		
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
			this.externals.push({ object: router, addPrefix: prefix })
		} else {
			const routePath = new RoutePath(prefix)
			this.externals.push({ object: routePath })
			router(routePath)
		}

		return this
	}

	/**
	 * Add Content Type Mapping
	 * @example
	 * ```
	 * controller.contentTypes((cT) => cT
	 *   .add('.jayson', 'application/json')
	 * )
	 * ```
	 * @since 5.3.0
	*/ contentTypes(
		/** The Code to handle the Headers */ code: (path: RouteContentTypes) => RouteContentTypes
	) {
		const routeContentTypes = new RouteContentTypes()
		this.externals.push({ object: routeContentTypes })
	
		code(routeContentTypes)
	
		return this
	}

	/**
	 * Add Default Headers
	 * @example
	 * ```
	 * controller.defaultHeaders((dH) => dH
	 *   .add('X-Api-Version', '1.0.0')
	 * )
	 * ```
	 * @since 5.3.0
	*/ defaultHeaders(
		/** The Code to handle the Headers */ code: (path: RouteDefaultHeaders) => RouteDefaultHeaders
	) {
		const routeDefaultHeaders = new RouteDefaultHeaders()
		this.externals.push({ object: routeDefaultHeaders })

		code(routeDefaultHeaders)

		return this
	}


	/**
	 * Internal Method for Generating Routes Object
	 * @since 6.0.0
	*/ async getData() {
		const routes: Route[] = [], webSockets: Websocket[] = [],
			statics: Static[] = [], loadPaths: LoadPath[] = []

		let contentTypes = {}, defaultHeaders = {}

		for (const external of this.externals) {
			const result = await external.object.getData(external.addPrefix || '/')

			if ('routes' in result) routes.push(...result.routes)
			if ('webSockets' in result) webSockets.push(...result.webSockets)
			if ('statics' in result) statics.push(...result.statics)
			if ('loadPaths' in result) loadPaths.push(...result.loadPaths)
			if ('contentTypes' in result) contentTypes = { ...contentTypes, ...result.contentTypes }
			if ('defaultHeaders' in result) defaultHeaders = { ...defaultHeaders, ...result.defaultHeaders }
		}

		return {
			routes, webSockets, statics,
			loadPaths, contentTypes, defaultHeaders
		}
	}
}