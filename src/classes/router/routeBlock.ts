import { getAllFiles, getAllFilesFilter } from "../../misc/getAllFiles"
import { Types as typesInterface } from "../../interfaces/methods"
import Route from "../../interfaces/route"
import { pathParser } from "../routeList"
import Ctr from "../../interfaces/ctr"
import { minifiedRoute } from "../routeList"
import types from "../../misc/methods"

import * as path from "path"
import * as fs from "fs"

export default class RouteBlock {
  private data: Route[]
  private path: string

  /** Generate Route Block */
  constructor(
    /** The Path of the Routes */ path: string
  ) {
    this.path = pathParser(path, true)
    this.data = []
  }

  /**
   * (Sync) Add a Route
   * @sync This Function adds a Route Syncronously
   * @example
   * ```
   * // The /devil route will be available on "path + /devil" so "/devil"
   * // Paths wont collide if the request methods are different
   * const routes = new webserver.routeList()
   * let devilsMessage = 'Im the one who knocks'
   * 
   * routes.routeBlock('/')
   *   .add(webserver.types.get, '/devil', async(ctr) => {
   *     return ctr
   *       .status(666)
   *       .print(devilsMessage)
   *   })
   *   .add(webserver.types.post, '/devil', async(ctr) => {
   *     devilsMessage = ctr.body
   *     return ctr
   *       .status(999)
   *       .print('The Devils message was set')
   *   })
   * ```
   * @since 3.1.0 
   */
	add(
		/** The Request Method */ method: typesInterface,
		/** The Path on which this will be available */ path: string,
		/** The Async Code to run on a Request */ code: (ctr: Ctr) => Promise<any> | any
	) {
		if (!types.includes(method)) throw TypeError(`No Valid Request Type: ${method}, Possible Values: ${types.join(', ')}`)
		if (this.data.some((obj) => (obj.method === method && obj.path === pathParser(path)))) return this

		this.data.push({
			method: method,
			path: pathParser(this.path + path),
			pathArray: pathParser(this.path + path).split('/'),
			code: code,
			data: {
				addTypes: false
			}
		})

		return this
	}

  /**
   * (Sync) Add a Redirect
   * @sync This Function adds a Redirect Syncronously
   * @example
   * ```
   * // The /devil route will automatically redirect to google.com
   * // Obviously still putting the prefix (in this case / from the routeBlock in front)
   * const routes = new webserver.routeList()
   * 
   * routes.routeBlock('/')
   *   .redirect('/devil', 'https://google.com')
   *   .redirect('/devilpics', 'https://google.com/search?q=devil')
   * ```
   * @since 3.1.0 
   */
	redirect(
		/** The Request Path to Trigger the Redirect on */ request: string,
		/** The Redirect Path to Redirect to */ redirect: string
	) {
		this.data.push({
			method: 'GET',
			path: pathParser(this.path + request),
			pathArray: pathParser(this.path + request).split('/'),
			code: (ctr) => ctr.redirect(redirect),
			data: {
				addTypes: false
			}
		})

		return this
	}

  /**
   * (Sync) Load Static Files
   * @sync This Function loads the static files Syncronously
   * @warning If new Files are added the Server needs to be reloaded
   * @example
   * ```
   * // All Files in "./static" will be served dynamically so they wont be loaded as routes by default
   * // Due to the hideHTML Option being on files will be served differently, index.html -> /; about.html -> /about
   * const routes = new webserver.routeList()
   * 
   * routes.routeBlock('/')
   *   .static('./static', {
   *     hideHTML: true, // If enabled will remove .html ending from files
   *     preLoad: false, // If enabled will load files into RAM instead of dynamically loading them
   *     addTypes: true, // If enabled will automatically add content-types to some file endings
   *   })
   * ```
   * @since 3.1.0
   */
	static(
		/** The Folder which will be used */ folder: string,
		/** Additional Configuration for Serving */ options: {
      /**
       * Automatically add Content-Type to some file endings
       * @default true
       * @since 3.1.0
       */ addTypes?: boolean
      /**
       * Automatically remove .html ending from files
       * @default false
       * @since 3.1.0
       */ hideHTML?: boolean
      /**
       * Automatically load files into RAM instead of dynamically loading them
       * @default false
       * @since 3.1.0
       */ preLoad?: boolean
    }
	) {
    const addTypes = options?.addTypes ?? true
    const hideHTML = options?.hideHTML ?? false
		const preLoad = options?.preLoad ?? false

		for (const file of getAllFiles(folder)) {
			let newPath = file.replace(folder, '')
			if (hideHTML) newPath = newPath
				.replace('/index.html', '/')
				.replace('.html', '')

			const index = this.data.push({
				method: 'STATIC',
				path: pathParser(this.path + newPath),
				pathArray: pathParser(this.path + newPath).split('/'),
				code: () => {},
				data: {
					addTypes,
					file
				}
			}); if (preLoad) this.data[index - 1].data.content = fs.readFileSync(file)
		}

		return this
	}

  /**
   * (Sync) Load CJS Route Files
   * @sync This Function loads the route files Syncronously
   * @example
   * ```
   * // All Files in "./routes" ending with .js will be loaded as routes
   * const routes = new webserver.routeList()
   * 
   * routes.routeBlock('/')
   *   .loadCJS('./static')
   * ```
   * @since 3.1.0
   */
	loadCJS(
		/** The Folder which will be used */ folder: string,
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

			this.data.push({
				method: route.method,
				path: pathParser(this.path + route.path),
				pathArray: pathParser(this.path + route.path).split('/'),
				code: route.code,
				data: {
					addTypes: false
				}
			})
		}

		return this
	}




  /**
   * Internal Method for Generating Routes Object
   * @ignore Please do not use
   */
  get() {
    return this.data
  }
}