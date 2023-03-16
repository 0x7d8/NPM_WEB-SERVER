import Route from "../interfaces/route"
import { ExternalRouter, LoadPath, Routed, HTTPMethods } from "../interfaces/internal"
import { Event } from "../interfaces/external"
import { Events } from "../interfaces/internal"

import RouteBlock from "./router/routeBlock"

export const pathParser = (path: string, removeSingleSlash?: boolean) => {
	path = path.replace(/\/{2,}/g, '/')

	if (path.endsWith('/') && path !== '/') path = path.slice(0, -1)
	if (!path.startsWith('/') && path !== '/') path = `/${path}`
	if (path.includes('/?')) path = path.replace('/?', '?')

	return ((removeSingleSlash && path === '/') ? '' : path || '/')
}

export interface minifiedRoute {
	/** The Request Method of the Route */ method: HTTPMethods
	/** The Path on which this will be available (+ prefix) */ path: string
	/** The Async Code to run on a Request */ code: Routed
}

export default class RouteList {
	private externals: ExternalRouter[]
	private events: Event[]

	/** List of Routes */
	constructor() {
		this.events = []

		this.externals = []
	}

	/**
	 * Add a new Event Response
	 * @sync This Function adds an event handler syncronously
	 * @example
   * ```
   * // We will log every time a request is made
   * const controller = new Server({ })
   * 
   * controller.event('request', (ctr) => {
	 *   console.log(`${ctr.url.method} Request made to ${ctr.url.path}`)
	 * })
   * ```
	 * @since 4.0.0
	*/
	event(
		/** The Event Name */ event: Events,
		/** The Async Code to run on a Request */ code: Routed
	) {
		if (this.events.some((obj) => (obj.event === event))) return this

		this.events.push({
			event: event,
			code: code
		}); return this
	}

	/**
	 * Add a new Block of Routes with a Prefix
	 * @sync This Function adds a prefix block syncronously
	 * @example
   * ```
   * const controller = new Server({ })
   * 
   * controller.prefix('/')
   *   .add('GET', '/cool', (ctr) => {
   *     ctr.print('cool!')
   *   })
   *   .prefix('/api')
   *     .add('GET', '/', (ctr) => {
   *       ctr.print('Welcome to the API')
   *     })
   * ```
	 * @since 4.0.0
	*/
	prefix(
		/** The Path Prefix */ prefix: string
	) {
		const routeBlock = new RouteBlock(prefix)
		this.externals.push({ method: 'get', object: routeBlock })

		return routeBlock
	}


	/**
   * Internal Method for Generating Routes Object
   * @sync This Function generates routes synchronously
   * @ignore This is meant for internal use
   * @since 3.1.0
  */
  getRoutes() {
		const routes = [], statics = [], loadPaths= [], validations = []
    for (const external of this.externals) {
			const result = external.object[external.method]()
			routes.push(...result.routes)
      statics.push(...result.statics)
			loadPaths.push(...result.loadPaths)
			validations.push(...result.validations)
		}

		return {
			events: this.events,
			routes, statics,
			loadPaths, validations
		}
  }
}