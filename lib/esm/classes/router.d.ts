import { Routed, HTTPMethods } from "../interfaces/internal";
import { Event } from "../interfaces/external";
import { Events } from "../interfaces/internal";
import RouteBlock from "./router/routeBlock";
export declare const pathParser: (path: string | string[], removeSingleSlash?: boolean) => string;
export interface minifiedRoute {
    /** The Request Method of the Route */ method: HTTPMethods;
    /** The Path on which this will be available (+ prefix) */ path: string;
    /** The Async Code to run on a Request */ code: Routed;
}
export default class RouteList {
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
