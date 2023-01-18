import { getAllFiles, getAllFilesFilter } from "../misc/getAllFiles"
import { types as typesInterface } from "../interfaces/types"
import route from "../interfaces/route"
import event, { events as eventsType } from "../interfaces/event"
import ctr from "../interfaces/ctr"
import types from "../misc/types"

import * as path from "path"
import * as fs from "fs"

interface staticOptions {
	/**
	 * If true then files will be loaded into RAM
	 * @default false
	*/ preload?: boolean
	/**
	 * If true then .html will be removed automatically
	 * @default false
	*/ remHTML?: boolean
	/**
	 * If true then some Content Types will be added automatically
	 * @default true
	*/ addTypes?: boolean
}

export default class routeList {
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
	}

	/** Set An Event Manually */
	event(
		/** The Event Name */ event: eventsType,
		/** The Async Code to run on a Request */ code: (ctr: ctr) => Promise<any>
	) {
		this.events.push({
			event: event,
			code: code
		})
	}

	/** Set A Route Manually */
	set(
		/** The Request Method */ method: typesInterface,
		/** The Path on which this will be available */ path: string,
		/** The Async Code to run on a Request */ code: (ctr: ctr) => Promise<any>
	) {
		if (!types.includes(method)) throw TypeError(`No Valid Request Type: ${method}\nPossible Values: ${types.join(', ')}`)
		this.routes.push({
			method: method,
			path: path,
			pathArray: path.split('/'),
			code: code,
			data: {
				addTypes: false
			}
		})
	}

	/** Serve Static Files */
	static(
		/** The Path to serve the Files on */ path: string,
		/** The Location of the Folder to load from */ folder: string,
		/** Additional Options */ options?: staticOptions
	) {
		const preload = options?.preload ?? false
		const remHTML = options?.remHTML ?? false
		const addTypes = options?.addTypes ?? true

		for (const file of getAllFiles(folder)) {
			const fileName = file.replace(folder, '')
			let urlName = ''
			if (fileName.replace('/', '') === 'index.html' && remHTML) urlName = path.replace('//', '/')
			else if (fileName.replace('/', '').endsWith('.html') && remHTML) urlName = (path + fileName).replace('//', '/').replace('.html', '')
			else urlName = (path + fileName).replace('//', '/')

			const index = this.routes.push({
				method: 'STATIC',
				path: urlName,
				pathArray: urlName.split('/'),
				code: async() => null,
				data: {
					addTypes,
					file
				}
			}); if (preload) this.routes[index].data.content = fs.readFileSync(file)
		}
	}

	/** Load External Function Files */
	load(
		/** The Location of the Folder to load from */ folder: string
	) {
		const files = getAllFilesFilter(folder, '.js')

		for (const file of files) {
			const route: route & { type: typesInterface } = require(path.resolve(file))

			if (
				!('path' in route) ||
				!('type' in route) ||
				!('code' in route)
			) continue
			if (!types.includes(route.type)) throw TypeError(`No Valid Request Type: ${route.type}\nPossible Values: ${types.join(', ')}`)

			this.routes.push({
				method: route.type,
				path: route.path,
				pathArray: route.path.split('/'),
				code: route.code,
				data: {
					addTypes: false
				}
			})
		}
	}

	/** Internal Function to access all routes as Array */
	list() {
		return { routes: this.routes, events: this.events }
	}
}