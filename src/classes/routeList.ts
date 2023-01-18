import { getAllFiles, getAllFilesFilter } from "../misc/getAllFiles"
import { types as typesInterface } from "../interfaces/types"
import route from "../interfaces/route"
import event, { events as eventsType } from "../interfaces/event"
import ctr from "../interfaces/ctr"
import types from "../misc/types"

import * as path from "path"
import * as fs from "fs"

export const pathParser = (path: string) => {
	path = path.replace(/\/{2,}/g, '/')

	if (path.endsWith('/')) return path.slice(0, -1)
	if (!path.startsWith('/')) return `/${path}`

	return path
}

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
		if (this.events.some((obj) => (obj.event === event))) return false

		return this.events.push({
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
		path = pathParser(path)

		if (!types.includes(method)) throw TypeError(`No Valid Request Type: ${method}\nPossible Values: ${types.join(', ')}`)
		if (this.routes.some((obj) => (obj.method === method && obj.path === path))) return false

		return this.routes.push({
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
		path = pathParser(path)

		const preload = options?.preload ?? false
		const remHTML = options?.remHTML ?? false
		const addTypes = options?.addTypes ?? true
		let arrayIndexes: number[] = []

		for (const file of getAllFiles(folder)) {
			let fileName = file.replace(folder, '').replace('/', '')
			let pathName = path + folder.replace(fileName, '').replace(folder, '').slice(0, -1)
			if (pathName.startsWith('.')) pathName = pathName.slice(-1)
			if (remHTML && fileName === 'index.html') fileName = ''
			else if (remHTML && fileName.endsWith('.html')) fileName = fileName.slice(0, -5)
			else if (remHTML && fileName.endsWith('.htm')) fileName = fileName.slice(0, -4)
			const urlName = `${pathName}/${fileName}`.endsWith('/')
				? `${pathName}`
				: `${pathName}` === '/'
					? `/${fileName}`
					: `${pathName}/${fileName}`

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
			arrayIndexes.push(index)
		}; return arrayIndexes
	}

	/** Load External Function Files */
	load(
		/** The Location of the Folder to load from */ folder: string
	) {
		const files = getAllFilesFilter(folder, '.js')
		let arrayIndexes: number[] = []

		for (const file of files) {
			const route: route & { type: typesInterface } = require(path.resolve(file))

			if (
				!('path' in route) ||
				!('type' in route) ||
				!('code' in route)
			) continue
			if (!types.includes(route.type)) throw TypeError(`No Valid Request Type: ${route.type}\nPossible Values: ${types.join(', ')}`)

			arrayIndexes.push(this.routes.push({
				method: route.type,
				path: route.path,
				pathArray: route.path.split('/'),
				code: route.code,
				data: {
					addTypes: false
				}
			}))
		}; return arrayIndexes
	}

	/** Internal Function to access all Routes & Events as Array */
	list() {
		return { routes: this.routes, events: this.events }
	}
}