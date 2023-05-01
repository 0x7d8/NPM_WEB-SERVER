import HTTP from "../../types/http"
import Static from "../../types/static"
import WebSocket from "../../types/webSocket"
import addPrefixes from "../../functions/addPrefixes"
import { ExternalRouter, LoadPath, MiddlewareInitted } from "../../types/internal"

import RoutePath from "./path"

export default class RouteExternal<GlobContext extends Record<any, any>, Middlewares extends MiddlewareInitted[] = []> {
  private external: ExternalRouter

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
	 * 
   * // index.js
   * const controller = new Server({ })
   * 
   * controller.path('/', require('./router.js'))
   * ```
	 * @since 5.9.3
	*/ constructor(
    /** The Code to handle the Prefix */ router: ((path: RoutePath<GlobContext, Middlewares>) => RoutePath<GlobContext, Middlewares>) | RoutePath<GlobContext, Middlewares>
	) {
		if ('getData' in router) {
			this.external = { object: router as any }
		} else {
			const routePath = new RoutePath<GlobContext, Middlewares>('/')
			this.external = { object: routePath as any }
			router(routePath)
		}
	}

  /**
	 * Internal Method for Generating Routes Object
	 * @since 6.0.0
	*/ public async getData(prefix: string) {
		const routes: HTTP[] = [], webSockets: WebSocket[] = [],
			statics: Static[] = [], loadPaths: LoadPath[] = []

		const result = await this.external.object.getData(this.external.addPrefix || '/')

		if ('routes' in result && result.routes.length > 0) routes.push(...addPrefixes(result.routes, 'path', 'pathArray' as any, prefix))
		if ('webSockets' in result && result.webSockets.length > 0) webSockets.push(...addPrefixes(result.webSockets, 'path', 'pathArray' as any, prefix))
		if ('statics' in result && result.statics.length > 0) statics.push(...addPrefixes(result.statics, 'path', null, prefix))
		if ('loadPaths' in result && result.loadPaths.length > 0) loadPaths.push(...addPrefixes(result.loadPaths, 'prefix', null, prefix))

		return {
			routes, webSockets,
			statics, loadPaths
		}
	}
}