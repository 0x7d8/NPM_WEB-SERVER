import { getAllFiles, getAllFilesFilter } from "../misc/getAllFiles"
import { Types as typesInterface } from "../interfaces/methods"
import route from "../interfaces/route"
import event, { Events as eventsType } from "../interfaces/event"
import ctr from "../interfaces/ctr"
import types from "../misc/methods"

import RouteBlock from "./router/routeBlock"

import * as path from "path"
import * as fs from "fs"

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
	/** The Async Code to run on a Request */ code: (ctr: ctr) => Promise<any>
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
	private authChecks: { path: string, func: (ctr: ctr) => Promise<any> | any}[]
	private routes: route[]
	private events: event[]

	/** List of Routes */
	constructor(
		/**
		 * Routes to Import
		 * @default []
		 */ routes?: route[],
		/**
		 * Events to Import
		 * @default []
		 */ events?: event[]
	) {
		routes = routes ?? []
		events = events ?? []

		this.routes = routes
		this.events = events
		this.authChecks = []
		this.externals = []
	}

	/**
	 * Set An Event Manually
	 */
	event(
		/** The Event Name */ event: eventsType,
		/** The Async Code to run on a Request */ code: (ctr: ctr) => Promise<any>
	) {
		if (this.events.some((obj) => (obj.event === event))) return false

		return this.events.push({
			event: event,
			code: code
		}) - 1
	}

	/**
	 * Set A Route Manually
	 * @deprecated Please use the new Route Blocks instead, RouteList.routeBlock(path)
	 */
	set(
		/** The Request Method */ method: typesInterface,
		/** The Path on which this will be available */ urlPath: string,
		/** The Async Code to run on a Request */ code: (ctr: ctr) => Promise<any>
	) {
		urlPath = pathParser(urlPath)

		if (!types.includes(method)) throw TypeError(`No Valid Request Type: ${method}, Possible Values: ${types.join(', ')}`)
		if (this.routes.some((obj) => (obj.method === method && obj.path === urlPath))) return false

		this.routes.push({
			method: method,
			path: urlPath,
			pathArray: urlPath.split('/'),
			code: code,
			data: {
				addTypes: false
			}
		})

		return this
	}

	/**
	 * Set A Route Block
	 * @deprecated Please use the new Route Blocks instead, RouteList.routeBlock(path)
	 */
	setBlock(
		/** The Path Prefix */ prefix: string,
		/** The Routes */ routes: minifiedRoute[]
	) {
		prefix = pathParser(prefix)

		for (let routeNumber = 0; routeNumber <= routes.length - 1; routeNumber++) {
			const route = routes[routeNumber]

			this.routes.push({
				method: route.method,
				path: `${prefix}${pathParser(route.path, true)}`,
				pathArray: `${prefix}${pathParser(route.path, true)}`.split('/'),
				code: route.code,
				data: {
					addTypes: false
				}
			})
		}

		return this
	}

	/**
	 * Set Redirects Manually
	 */
	setRedirects(
		/** The Redirects */ redirects: minifiedRedirect[]
	) {
		for (let redirectNumber = 0; redirectNumber <= redirects.length - 1; redirectNumber++) {
			const redirect = redirects[redirectNumber]

			this.routes.push({
				method: redirect.method,
				path: pathParser(redirect.path),
				pathArray: pathParser(redirect.path, true).split('/'),
				code: async(ctr) => {
					return ctr.redirect(redirect.destination)
				}, data: {
					addTypes: false
				}
			})
		}

		return this
	}

	/**
	 * Create A new Route Block
	 * @since 3.1.0
	 */
	routeBlock(
		/** The Path Prefix */ prefix: string
	) {
		const routeBlock = new RouteBlock(prefix)
		this.externals.push({ method: 'get', object: routeBlock })

		return routeBlock
	}

	/**
	 * Serve Static Files
	 * @deprecated Please use the new Route Blocks instead, RouteList.routeBlock(path)
	 */
	static(
		/** The Path to serve the Files on */ urlPath: string,
		/** The Location of the Folder to load from */ folder: string,
		/** Additional Options */ options?: staticOptions
	) {
		urlPath = pathParser(urlPath)

		const preload = options?.preload ?? false
		const remHTML = options?.remHTML ?? false
		const addTypes = options?.addTypes ?? true

		for (const file of getAllFiles(folder)) {
			let newPath = file.replace(folder, '')
			if (remHTML) newPath = newPath
				.replace('/index.html', '/')
				.replace('.html', '')

			const urlName = pathParser(newPath)
			const index = this.routes.push({
				method: 'STATIC',
				path: urlName,
				pathArray: urlName.split('/'),
				code: async() => undefined,
				data: {
					addTypes,
					file
				}
			}); if (preload) this.routes[index - 1].data.content = fs.readFileSync(file)
		}

		return this
	}

	/**
	 * Load External Function files
	 * @deprecated Please use the new Route Blocks instead, RouteList.routeBlock(path).loadCJS()
	 */
	load(
		/** The Location of the Folder to load from */ folder: string
	) {
		const files = getAllFilesFilter(folder, '.js')

		for (const file of files) {
			const route: minifiedRoute = require(path.resolve(file))

			if (
				!('path' in route) ||
				!('method' in route) ||
				!('code' in route)
			) continue
			if (!types.includes(route.method)) throw TypeError(`No Valid Request Type: ${route.method}, Possible Values: ${types.join(', ')}`)

			this.routes.push({
				method: route.method,
				path: pathParser(route.path),
				pathArray: pathParser(route.path).split('/'),
				code: route.code,
				data: {
					addTypes: false
				}
			})
		}

		return this
	}

	/**
	 * Internal Function to access all Routes & Events as Array
	 * @ignore This is only for internal use
	 */
	list() {
		for (const external of this.externals) {
			const result = external.object[external.method]()
			this.routes.push(...result.routes)
			if (result.authCheck) this.authChecks.push({ path: result.path, func: result.authCheck })
		}

		return { routes: this.routes, events: this.events, authChecks: this.authChecks }
	}
}