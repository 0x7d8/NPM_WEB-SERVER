import addPrefixes from "../../functions/addPrefixes"
import { ExternalRouter } from "../../types/internal"

import RoutePath from "./path"

export default class RouteExternal {
  protected external: ExternalRouter

  /**
	 * Create a new External Router
	 * @example
	 * ```
   * // router.js
	 * module.exports = new ExternalRouter((path) => path
	 *   .http('GET', '/cool', (ctr) => {
	 *     ctr.print('cool!')
	 *   })
	 *   .path('/api', (path) => path
	 *     .http('GET', '/', (ctr) => {
	 *       ctr.print('Welcome to the API')
	 *     })
	 *   )
	 * )
	 * ```
   * 
   * ```
   * // index.js
   * const controller = new Server({ })
   * 
   * controller.path('/', require('./router.js'))
   * ```
	 * @since 5.9.3
	*/
  constructor(
    /** The Code to handle the Prefix */ router: (path: RoutePath) => RoutePath | RoutePath
	) {
		if ('getRoutes' in router) {
			this.external = { method: 'getRoutes', object: router }
		} else {
			const routePath = new RoutePath('/')
			this.external = { method: 'getRoutes', object: routePath }
			router(routePath)
		}
	}

  /**
	 * Internal Method for Generating Routes Object
	 * @since 5.9.3
	*/
	protected async getRoutes(prefix: string) {
		const routes = [], webSockets = [],
			statics = [], loadPaths = []

		const result = await (this.external.object as any)[this.external.method]()

		if ('routes' in result && result.routes.length > 0) routes.push(...addPrefixes(result.routes, 'path', 'pathArray', prefix))
		if ('webSockets' in result && result.webSockets.length > 0) webSockets.push(...addPrefixes(result.webSockets, 'path', 'pathArray', prefix))
		if ('statics' in result && result.statics.length > 0) statics.push(...addPrefixes(result.statics, 'path', null, prefix))
		if ('loadPaths' in result && result.loadPaths.length > 0) loadPaths.push(...addPrefixes(result.routes, 'prefix', null, prefix))

		return {
			routes, webSockets,
			statics, loadPaths
		}
	}
}