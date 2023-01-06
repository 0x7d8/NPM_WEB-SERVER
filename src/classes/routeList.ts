import { getAllFiles, getAllFilesFilter } from "../misc/getAllFiles"
import page from "../interfaces/page"
import ctr from "../interfaces/ctr"
import types from "../misc/types"

import * as path from "path"
import * as fs from "fs"

interface staticOptions {
	/** If true then files will be loaded into RAM */ preload: boolean
	/** If true then .html will be removed automatically */ remHTML: boolean
}

export = class routeList {
	urls: page[]

	constructor() {
		this.urls = []
	}

	set(/** The Request Type */ type: typeof types[number], /** The Path on which this will be available */ path: string, /** The Async Code to run on a Request */ code: (ctr: ctr) => Promise<void>) {
		if (!types.includes(type)) throw TypeError(`No Valid Request Type: ${type}\nPossible Values: ${types.join(', ')}`)
		this.urls[type + path] = {
			array: path.split('/'),
			path,
			type,
			code
		}
	}
	
	static(/** The Path to serve the Files on */ path: string, /** The Location of the Folder to load from */ folder: string, options: staticOptions) {
		const preload = options?.preload || false
		const remHTML = options?.remHTML || false

		for (const file of getAllFiles(folder)) {
			const fileName = file.replace(folder, '')
			let urlName = ''
			if (fileName.replace('/', '') === 'index.html' && remHTML) urlName = path.replace('//', '/')
			else if (fileName.replace('/', '').endsWith('.html') && remHTML) urlName = (path + fileName).replace('//', '/').replace('.html', '')
			else urlName = (path + fileName).replace('//', '/')

			this.urls['GET' + urlName] = {
				file,
				array: urlName.split('/'),
				path: urlName,
				type: 'STATIC'
			}; if (preload) this.urls['GET' + urlName].content = fs.readFileSync(file)
		}
	}

	load(/** The Location of the Folder to load from */ folder: string) {
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
				path: route.path,
				type: route.type,
				code: route.code
			}
		}
	}
	
	list() {
		return this.urls
	}
}