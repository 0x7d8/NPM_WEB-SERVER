import { ExternalRouter, LoadPath, Routed, HTTPMethods } from "../../interfaces/internal"
import Static from "../../interfaces/static"
import Route from "../../interfaces/route"
import { pathParser } from "../router"
import types from "../../misc/methods"

import path from "path"
import fs from "fs"

export default class RouteBlock {
  protected externals: ExternalRouter[]
  protected validations: Routed[]
  protected loadPaths: LoadPath[]
  protected statics: Static[]
  protected routes: Route[]
  protected path: string

  /** Generate Route Block */
  constructor(
    /** The Path of the Routes */ path: string,
    /** The Validations to add */ validations?: Routed[]
  ) {
    this.path = pathParser(path)
    this.routes = []
    this.statics = []
    this.loadPaths = []

    this.validations = validations || []
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
		/** The Function to Validate thr Request */ code: Routed
	) {
		this.validations.push(code)

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
		/** The Request Method */ method: HTTPMethods,
		/** The Path on which this will be available */ path: string,
		/** The Async Code to run on a Request */ code: Routed
	) {
		if (!types.includes(method)) throw TypeError(`No Valid Request Type: ${method}, Possible Values: ${types.join(', ')}`)
		if (this.routes.some((obj) => (obj.method === method && obj.path === pathParser(path)))) return this

		this.routes.push({
      type: 'route',
			method: method,
			path: pathParser(this.path + path),
			pathArray: pathParser(this.path + path).split('/'),
			code: code,
			data: {
        validations: this.validations
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
      type: 'route',
			method: 'GET',
			path: pathParser(this.path + request),
			pathArray: pathParser(this.path + request).split('/'),
			code: (ctr) => ctr.redirect(redirect),
      data: {
        validations: this.validations
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
    } = {}
	) {
    const addTypes = options?.addTypes ?? true
    const hideHTML = options?.hideHTML ?? false

		this.statics.push({
      type: 'static',
			path: pathParser(this.path),
      location: folder,
			data: {
				addTypes, hideHTML,
        validations: this.validations
			}
		})

		return this
	}

  /**
   * (Sync) Load CJS Route Files
   * @sync This Function schedules the route files to load Syncronously
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
    if (!fs.existsSync(path.resolve(folder))) throw Error('The CJS Function folder wasnt found!')

    this.loadPaths.push({
      path: path.resolve(folder),
      prefix: this.path,
      type: 'cjs',
      validations: this.validations
    })

		return this
	}

  /**
   * (Async) Load ESM Route Files
   * @sync This Function schedules the route files to load Syncronously
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
    if (!fs.existsSync(path.resolve(folder))) throw Error('The ESM Function folder wasnt found!')

    this.loadPaths.push({
      path: path.resolve(folder),
      prefix: this.path,
      type: 'esm',
      validations: this.validations
    })

		return this
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
		const routeBlock = new RouteBlock(this.path + '/' + prefix ?? '/', this.validations)
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
      this.loadPaths.push(...result.loadPaths)
		}

		return {
      routes: this.routes,
      statics: this.statics,
      loadPaths: this.loadPaths,
      validations: this.validations
    }
  }
}