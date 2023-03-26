import { ExternalRouter } from "../../types/internal"
import { Middleware } from "../../types/external"
import Event, { EventHandlerMap, Events } from "../../types/event"

import RoutePath from "./path"
import RouteContentTypes from "./contentTypes"
import RouteDefaultHeaders from "./defaultHeaders"

export const pathParser = (path: string | string[], removeSingleSlash?: boolean) => {
	const paths = typeof path === 'string' ? [path] : path
	let output = ''

	for (let pathIndex = 0; pathIndex < paths.length; pathIndex++) {
		path = paths[pathIndex].replace(/\/{2,}/g, '/')

		if (path.endsWith('?')) path = path.slice(0, -1)
		if (path.endsWith('/') && path !== '/') path = path.slice(0, -1)
		if (!path.startsWith('/') && path !== '/') path = `/${path}`

		output += (removeSingleSlash && path === '/') ? '' : path || '/'
	}

	return output.replace(/\/{2,}/g, '/')
}

export default class RouteList {
	protected middlewares: Middleware[]
	private externals: ExternalRouter[]
	private events: Event[]

	/** List of Routes */
	constructor() {
		this.events = []
		this.externals = []
		this.middlewares = []
	}

	/**
	 * Add a new Event Response
	 * @example
	 * ```
	 * // We will log every time a request is made
	 * const controller = new Server({ })
	 * 
	 * controller.event('httpRequest', (ctr) => {
	 *   console.log(`${ctr.url.method} Request made to ${ctr.url.path}`)
	 * })
	 * ```
	 * @since 4.0.0
	*/
	event<EventName extends Events>(
		/** The Event Name */ event: EventName,
		/** The Async Code to run on a Request */ code: EventHandlerMap[EventName]
	) {
		if (this.events.some((obj) => (obj.name === event))) return this

		this.events.push({
			name: event, code
		} as any)

		return this
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
	*/
	middleware(
		/** The Middleware to run on a Request */ middleware: Middleware
	) {
		if (this.middlewares.some((obj) => (obj.name === middleware.name))) return this

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
	*/
	path(
		/** The Path Prefix */ prefix: string,
		/** The Code to handle the Prefix */ code: (path: RoutePath) => RoutePath
	) {
		const routePath = new RoutePath(prefix)
		this.externals.push({ method: 'getRoutes', object: routePath })
		code(routePath)

		return this
	}

	/**
	 * Add a new Block of File -> Content Types Mapping
	 * @example
	 * ```
	 * const controller = new Server({ })
	 * 
	 * controller.contentTypes()
	 *   .add('.png', 'image/png')
	 * ```
	 * @since 5.3.0
	*/
	contentTypes(
		/** The Content Types to import from a JSON */ contentTypes: Record<string, string> = {}
	) {
		const routeContentTypes = new RouteContentTypes(contentTypes)
		this.externals.push({ method: 'getTypes', object: routeContentTypes })

		return routeContentTypes
	}

	/**
	 * Add a new Block of Default Headers
	 * @example
	 * ```
	 * const controller = new Server({ })
	 * 
	 * controller.defaultHeaders()
	 *   .add('Copyright', 2023)
	 * ```
	 * @since 5.3.0
	*/
	defaultHeaders(
		/** The Headers to import from a JSON */ defaultHeaders: Record<Lowercase<string>, string> = {}
	) {
		const routeDefaultHeaders = new RouteDefaultHeaders(defaultHeaders)
		this.externals.push({ method: 'getHeaders', object: routeDefaultHeaders })

		return routeDefaultHeaders
	}


	/**
	 * Internal Method for Generating Routes Object
	 * @since 3.1.0
	*/
	protected async getRoutes() {
		const routes = [], webSockets = [], statics = [], loadPaths = []
		let contentTypes = {}, defaultHeaders = {}
		for (const external of this.externals) {
			const result = await external.object[external.method]()

			if ('routes' in result) routes.push(...result.routes)
			if ('webSockets' in result) webSockets.push(...result.webSockets)
			if ('statics' in result) statics.push(...result.statics)
			if ('loadPaths' in result) loadPaths.push(...result.loadPaths)
			if ('contentTypes' in result) contentTypes = { ...contentTypes, ...result.contentTypes }
			if ('defaultHeaders' in result) defaultHeaders = { ...defaultHeaders, ...result.defaultHeaders }
		}

		return {
			events: this.events, routes, webSockets, statics,
			loadPaths, contentTypes, defaultHeaders
		}
	}
}