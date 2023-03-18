import { Routed } from "../interfaces/internal";
import { Event, Middleware } from "../interfaces/external";
import { Events } from "../interfaces/internal";
import RouteBlock from "./router/routeBlock";
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
   * controller.event('request', (ctr) => {
     *   console.log(`${ctr.url.method} Request made to ${ctr.url.path}`)
     * })
   * ```
     * @since 4.0.0
    */
    event(
    /** The Event Name */ event: Events, 
    /** The Async Code to run on a Request */ code: Routed): this;
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
    /** The Path Prefix */ prefix: string): RouteBlock;
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
        validations: any[];
    };
}
