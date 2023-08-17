import { ExternalRouter, LoadPath, MiddlewareInitted } from "../../types/internal"
import SafeServerEventEmitter from "../safeEventEmitter"
import HTTP from "../../types/http"
import Websocket from "../../types/webSocket"
import Static from "../../types/static"

import RoutePath from "./path"
import RouteContentTypes from "./contentTypes"
import RouteDefaultHeaders from "./defaultHeaders"
import { zValidate } from "rjutils-collection"

export default class RouteIndex<GlobContext extends Record<any, any>, Middlewares extends MiddlewareInitted[] = []> extends SafeServerEventEmitter<GlobContext, Middlewares> {
	protected middlewares: MiddlewareInitted[]
	private externals: ExternalRouter[]

	/**
	 * List of Routes
	*/ constructor() {
		super()

		this.externals = []
		this.middlewares = []
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
	 *     .http('GET', '/', (http) => http
	 *       .onRequest((ctr) => {
	 *         ctr.print('Welcome to the API!')
	 *       })
	 *     )
	 *   )
	 * )
	 * ```
	 * @since 5.0.0
	*/ @zValidate([ (z) => z.string(), (z) => z.union([ z.function(), z.instanceof(RoutePath) ]) ])
	public path<Path extends string>(
		/** The Path Prefix */ prefix: Path,
		/** The Code to handle the Prefix */ router: ((path: RoutePath<GlobContext, Middlewares, Path>) => any) | RoutePath<any, any>
	): this {
		if ('getData' in router) {
			this.externals.push({ object: router, addPrefix: prefix })
		} else {
			const routePath = new RoutePath<GlobContext, Middlewares, Path>(prefix as any)
			this.externals.push({ object: routePath as any })
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
	*/ @zValidate([ (z) => z.function() ])
	public contentTypes(
		/** The Callback to handle the Headers */ callback: (contentTypes: RouteContentTypes) => RouteContentTypes
	): this {
		const routeContentTypes = new RouteContentTypes()
		this.externals.push({ object: routeContentTypes })
	
		callback(routeContentTypes)
	
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
	*/ @zValidate([ (z) => z.function() ])
	public defaultHeaders(
		/** The Callback to handle the Headers */ callback: (defaultHeaders: RouteDefaultHeaders) => RouteDefaultHeaders
	): this {
		const routeDefaultHeaders = new RouteDefaultHeaders()
		this.externals.push({ object: routeDefaultHeaders })

		callback(routeDefaultHeaders)

		return this
	}


	/**
	 * Internal Method for Generating Routes Object
	 * @since 6.0.0
	*/ public async getData() {
		const routes: HTTP[] = [], webSockets: Websocket[] = [],
			statics: Static[] = [], loadPaths: LoadPath[] = []

		let contentTypes = {}, defaultHeaders = {}

		for (const external of this.externals) {
			const result = await external.object.getData(external.addPrefix ?? '/')

			if ('routes' in result) routes.push(...result.routes)
			if ('webSockets' in result) webSockets.push(...result.webSockets)
			if ('statics' in result) statics.push(...result.statics)
			if ('loadPaths' in result) loadPaths.push(...result.loadPaths)
			if ('contentTypes' in result) contentTypes = Object.assign(contentTypes, result.contentTypes)
			if ('defaultHeaders' in result) defaultHeaders = Object.assign(defaultHeaders, result.defaultHeaders)
		}

		return {
			routes, webSockets, statics,
			loadPaths, contentTypes, defaultHeaders
		}
	}
}