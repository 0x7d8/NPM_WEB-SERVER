import { Middleware } from "../../interfaces/external";
import Event, { EventHandlerMap, Events } from "../../interfaces/event";
import RoutePath from "./path";
export declare const pathParser: (path: string | string[], removeSingleSlash?: boolean) => string;
export default class RouteList {
    protected middlewares: Middleware[];
    private externals;
    private events;
    /** List of Routes */
    constructor();
    /**
     * Add a new Event Response
     * @example
   * ```
   * // We will log every time a request is made
   * const controller = new Server({ })
   *
   * controller.event('httpRequest', (ctr) => {
     *   console.log(`${ctr.url.method} Request made to ${ctr.url.path}`)
     * })
   * ```
     * @since 4.0.0
    */
    event<EventName extends Events>(
    /** The Event Name */ event: EventName, 
    /** The Async Code to run on a Request */ code: EventHandlerMap[EventName]): this;
    /**
     * Add a new Middleware
     * @example
   * ```
   * // We will use the custom middleware
     * const middleware = require('middleware-package')
   * const controller = new Server({ })
   *
   * controller.middleware(middleware())
   * ```
     * @since 4.4.0
    */
    middleware(
    /** The Middleware to run on a Request */ middleware: Middleware): this;
    /**
     * Add a new Block of Routes with a Prefix
     * @example
   * ```
   * const controller = new Server({ })
   *
   * controller.path('/', (path) => path
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
     * @since 5.0.0
    */
    path(
    /** The Path Prefix */ prefix: string, 
    /** The Code to handle the Prefix */ code: (path: RoutePath) => RoutePath): this;
    /**
   * Internal Method for Generating Routes Object
   * @ignore This is meant for internal use
   * @since 3.1.0
  */
    getRoutes(): {
        events: Event[];
        routes: any[];
        statics: any[];
        loadPaths: any[];
    };
}
