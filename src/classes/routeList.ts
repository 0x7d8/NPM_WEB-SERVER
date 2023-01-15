import { getAllFiles, getAllFilesFilter } from "../misc/getAllFiles"
import { types as typesInterface } from "../interfaces/types"
import page from "../interfaces/page"
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
	private urls: page[]

	/** List of Routes */
	constructor(
		/**
		 * Routes to Import
		 * @default []
		 */ routes?: page[]
	) {
		routes = routes ?? []
		this.urls = routes
	}

	/** Set A Route Manually */
	set(
		/** The Request Type */ type: typesInterface,
		/** The Path on which this will be available */ path: string,
		/** The Async Code to run on a Request */ code: (ctr: ctr) => Promise<any>
	) {
		if (!types.includes(type)) throw TypeError(`No Valid Request Type: ${type}\nPossible Values: ${types.join(', ')}`)
		this.urls[type + path] = {
			array: path.split('/'),
			addTypes: false,
			path,
			type,
			code
		}
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

			this.urls['GET' + urlName] = {
				file,
				array: urlName.split('/'),
				addTypes,
				path: urlName,
				type: 'STATIC'
			}; if (preload) this.urls['GET' + urlName].content = fs.readFileSync(file)
		}
	}

	/** Load External Function Files */
	load(
		/** The Location of the Folder to load from */ folder: string
	) {
		const files = getAllFilesFilter(folder, '.js')

		for (const file of files) {
			const route = require(path.resolve(file))

			if (
				!('path' in route) ||
				!('type' in route) ||
				!('code' in route)
			) continue
			if (!types.includes(route.type)) throw TypeError(`No Valid Request Type: ${route.type}\nPossible Values: ${types.toString()}`)

			this.urls[route.type + route.path] = {
				array: route.path.split('/'),
				addTypes: false,
				path: route.path,
				type: route.type,
				code: route.code
			}
		}
	}

	/** Internal Function to access all URLs as Array */
	list() {
		return this.urls
	}
}