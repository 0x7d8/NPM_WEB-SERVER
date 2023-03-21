import { ExternalRouter } from "../../interfaces/internal"
import { Middleware } from "../../interfaces/external"
import Event, { EventHandlerMap, Events } from "../../interfaces/event"

import RoutePath from "./path"

export const pathParser = (path: string | string[], removeSingleSlash?: boolean) => {
	const paths = typeof path === 'string' ? [path] : path
	let output = ''

	for (let pathIndex = 0; pathIndex <= paths.length - 1; pathIndex++) {
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
			name: event as any, code
		})

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
	 * Internal Method for Generating Routes Object
	 * @ignore This is meant for internal use
	 * @since 3.1.0
	*/
	getRoutes() {
		const routes = [], statics = [], loadPaths= []
		for (const external of this.externals) {
			const result = external.object[external.method]()
			routes.push(...result.routes)
			statics.push(...result.statics)
			loadPaths.push(...result.loadPaths)
		}

		return {
			events: this.events,
			routes, statics,
			loadPaths
		}
	}
}