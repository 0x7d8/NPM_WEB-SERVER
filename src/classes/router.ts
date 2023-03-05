import { Types as typesInterface } from "../interfaces/methods"
import Route from "../interfaces/route"
import Event, { Events } from "../interfaces/event"
import Static from "../interfaces/static"
import Ctr from "../interfaces/ctr"

import RouteBlock from "./router/routeBlock"

export const pathParser = (path: string, removeSingleSlash?: boolean) => {
	path = path.replace(/\/{2,}/g, '/')

	if (path.endsWith('/') && path !== '/') path = path.slice(0, -1)
	if (!path.startsWith('/') && path !== '/') path = `/${path}`
	if (path.includes('/?')) path = path.replace('/?', '?')

	return ((removeSingleSlash && path === '/') ? '' : path)
}

export interface minifiedRoute {
	/** The Request Method of the Route */ method: typesInterface
	/** The Path on which this will be available (+ prefix) */ path: string
	/** The Async Code to run on a Request */ code: (ctr: Ctr) => Promise<any>
}

export interface minifiedRedirect {
	/** The Request Method of the Redirect */ method: typesInterface
	/** The Path on which this will be available */ path: string
	/** The URL which it will send to */ destination: string
}

export interface staticOptions {
	/**
	 * Whether the files will be loaded into Memory
	 * @default false
	*/ preload?: boolean
	/**
	 * Whether .html & .htm endings will be removed automatically
	 * @default false
	*/ remHTML?: boolean
	/**
	 * Whether some Content Type Headers will be added automatically
	 * @default true
	*/ addTypes?: boolean
}

export default class RouteList {
	private externals: { method: string, object: any }[]
	private authChecks: { path: string, func: (ctr: Ctr) => Promise<any> | any }[]
	private statics: Static[]
  private routes: Route[]
	private events: Event[]

	/** List of Routes */
	constructor() {
		this.routes = []
		this.events = []
		this.statics = []

		this.externals = []
	}

	/**
	 * Add a new Event Response
	 * @since 4.0.0
	*/
	event(
		/** The Event Name */ event: Events,
		/** The Async Code to run on a Request */ code: (ctr: Ctr) => Promise<any>
	) {
		if (this.events.some((obj) => (obj.event === event))) return false

		return this.events.push({
			event: event,
			code: code
		}) - 1
	}

	/**
	 * Add a new Block of Routes with a Prefix
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
    for (const external of this.externals) {
			const result = external.object[external.method]()
			this.routes.push(...result.routes)
      this.statics.push(...result.statics)
		}

		return { events: this.events, routes: this.routes, statics: this.statics, authChecks: this.authChecks }
  }
}