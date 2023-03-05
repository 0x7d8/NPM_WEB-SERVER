import { getAllFiles, getAllFilesFilter } from "../../misc/getAllFiles"
import { Types as typesInterface } from "../../interfaces/methods"
import Static from "../../interfaces/static"
import Route from "../../interfaces/route"
import { pathParser } from "../router"
import Ctr from "../../interfaces/ctr"
import { minifiedRoute } from "../router"
import types from "../../misc/methods"

import requireESM from "require-esm-in-cjs"
import path from "path"

export default class RouteBlock {
  private externals: { method: string, object: any }[]
  private authChecks: { path: string, func: (ctr: Ctr) => Promise<any> | any }[]
  private statics: Static[]
  private routes: Route[]
  private path: string

  /** Generate Route Block */
  constructor(
    /** The Path of the Routes */ path: string,
    /** The Authchecks to add */ authChecks?: { path: string, func: (ctr: Ctr) => Promise<any> | any }[]
  ) {
    this.path = pathParser(path)
    this.routes = []
    this.statics = []

    this.authChecks = authChecks || []
		this.externals = []
  }

  /**
   * (Sync) Add Validation
   * @sync This Function adds Validation Syncronously
   * @example
   * ```
   * // The /api route will automatically check for correct credentials
   * // Obviously still putting the prefix (in this case / from the routeBlock in front)
   * // Please note that in order to respond unautorized the status cant be 2xx
   * const controller = new Server({ })
   * 
   * controller.prefix('/api')
   *   .validate(async(ctr) => {
   *     if (!ctr.headers.has('Authorization')) return ctr.status(401).print('Unauthorized')
   *     if (ctr.headers.get('Authorization') !== 'key123 or db request ig') return ctr.status(401).print('Unauthorized')
   * 
   *     return ctr.status(200)
   *   })
   *   .redirect('/pics', 'https://google.com/search?q=devil')
   * ```
   * @since 3.2.1
  */
	validate(
		/** The Function to Validate thr Request */ code: (ctr: Ctr) => Promise<any> | any
	) {
		this.authChecks.push({ path: this.path, func: code })

		return this
	}

  /**
   * (Sync) Add a Route
   * @sync This Function adds a Route Syncronously
   * @example
   * ```
   * // The /devil route will be available on "path + /devil" so "/devil"
   * // Paths wont collide if the request methods are different
   * const controller = new Server({ })
   * let devilsMessage = 'Im the one who knocks'
   * 
   * controller.prefix('/')
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
		if (this.routes.some((obj) => (obj.method === method && obj.path === pathParser(path)))) return this

		this.routes.push({
			method: method,
			path: pathParser(this.path + path),
			pathArray: pathParser(this.path + path).split('/'),
			code: code,
			data: {
				addTypes: false,
        authChecks: this.authChecks.map((check) => check.func)
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
   * const controller = new Server({ })
   * 
   * controller.prefix('/')
   *   .redirect('/devil', 'https://google.com')
   *   .redirect('/devilpics', 'https://google.com/search?q=devil')
   * ```
   * @since 3.1.0
  */
	redirect(
		/** The Request Path to Trigger the Redirect on */ request: string,
		/** The Redirect Path to Redirect to */ redirect: string
	) {
		this.routes.push({
			method: 'GET',
			path: pathParser(this.path + request),
			pathArray: pathParser(this.path + request).split('/'),
			code: (ctr) => ctr.redirect(redirect),
      data: {
				addTypes: false,
        authChecks: this.authChecks.map((check) => check.func)
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
   * // Due to the hideHTML Option being on files will be served differently, /index.html -> /; /about.html -> /about
   * const controller = new Server({ })
   * 
   * controller.prefix('/')
   *   .static('./static', {
   *     hideHTML: true, // If enabled will remove .html ending from files
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
    }
	) {
    const addTypes = options?.addTypes ?? true
    const hideHTML = options?.hideHTML ?? false

		this.statics.push({
			path: pathParser(this.path),
      location: folder,
			data: {
				addTypes, hideHTML,
        authChecks: this.authChecks.map((check) => check.func)
			}
		})

		return this
	}

  /**
   * (Sync) Load CJS Route Files
   * @sync This Function loads the route files Syncronously
   * @example
   * ```
   * // All Files in "./routes" ending with .js will be loaded as routes
   * const controller = new Server({ })
   * 
   * controller.prefix('/')
   *   .loadCJS('./routes')
   * ```
   * @since 3.1.0
  */
	loadCJS(
		/** The Folder which will be used */ folder: string,
	) {
    const files = getAllFilesFilter(folder, 'js')

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
				path: pathParser(this.path + route.path),
				pathArray: pathParser(this.path + route.path).split('/'),
				code: route.code,
				data: {
					addTypes: false,
          authChecks: this.authChecks.map((check) => check.func)
				}
			})
		}

		return this
	}

  /**
   * (Async) Load ESM Route Files
   * @sync This Function loads the route files Syncronously
   * @warning This function calls import() Syncronously
   * @example
   * ```
   * // All Files in "./routes" ending with .js will be loaded as routes
   * const controller = new Server({ })
   * 
   * controller.prefix('/')
   *   .loadESM('./routes')
   * ```
   * @since 4.0.0
  */
	loadESM(
		/** The Folder which will be used */ folder: string,
	) {
    const files = getAllFilesFilter(folder, 'js')

		for (const file of files) {
			const route: minifiedRoute = requireESM(path.resolve(file))

			if (
        route &&
				!('path' in route) ||
				!('method' in route) ||
				!('code' in route)
			) continue
			if (!types.includes(route.method)) throw TypeError(`No Valid Request Type: ${route.method}, Possible Values: ${types.join(', ')}`)

			this.routes.push({
				method: route.method,
				path: pathParser(this.path + route.path),
				pathArray: pathParser(this.path + route.path).split('/'),
				code: route.code,
				data: {
					addTypes: false,
          authChecks: this.authChecks.map((check) => check.func)
				}
			})
		}

		return this
	}

  /**
	 * Add a new Block of Routes with a Prefix
   * @sync This Function adds a sub-route block syncronously
	 * @since 4.0.0
	*/
	prefix(
		/** The Path Prefix */ prefix: string
	) {
		const routeBlock = new RouteBlock(this.path + '/' + prefix ?? '/', this.authChecks)
		this.externals.push({ method: 'get', object: routeBlock })

		return routeBlock
	}


  /**
   * Internal Method for Generating Routes Object
   * @sync This Function generates routes synchronously
   * @ignore This is meant for internal use
   * @since 3.1.0
  */
  get() {
    for (const external of this.externals) {
			const result = external.object[external.method]()
			this.routes.push(...result.routes)
      this.statics.push(...result.statics)
		}

		return { routes: this.routes, statics: this.statics, authChecks: this.authChecks }
  }
}