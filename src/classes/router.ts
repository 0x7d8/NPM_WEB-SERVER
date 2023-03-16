import { ExternalRouter, Routed, HTTPMethods } from "../interfaces/internal"
import { Event } from "../interfaces/external"
import { Events } from "../interfaces/internal"

import RouteBlock from "./router/routeBlock"

export const pathParser = (path: string | string[], removeSingleSlash?: boolean) => {
	const paths = typeof path === 'string' ? [path] : path
	let output = ''

	for (let pathIndex = 0; pathIndex <= paths.length - 1; pathIndex++) {
		path = paths[pathIndex].replace(/\/{2,}/g, '/')

		if (path.endsWith('/') && path !== '/') path = path.slice(0, -1)
		if (!path.startsWith('/') && path !== '/') path = `/${path}`
		if (path.includes('/?')) path = path.replace('/?', '?')

		output += (removeSingleSlash && path === '/') ? '' : path || '/'
	}

	return output.replace(/\/{2,}/g, '/')
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
			event, code
		}); return this
	}

	/**
	 * Add a new Block of Routes with a Prefix
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