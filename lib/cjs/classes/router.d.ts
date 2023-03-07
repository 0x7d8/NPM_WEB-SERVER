import { Types as typesInterface } from "../interfaces/methods";
import Route from "../interfaces/route";
import Event, { Events } from "../interfaces/event";
import Static from "../interfaces/static";
import Ctr from "../interfaces/ctr";
import RouteBlock from "./router/routeBlock";
export declare const pathParser: (path: string, removeSingleSlash?: boolean) => string;
export interface minifiedRoute {
    /** The Request Method of the Route */ method: typesInterface;
    /** The Path on which this will be available (+ prefix) */ path: string;
    /** The Async Code to run on a Request */ code: (ctr: Ctr) => Promise<any>;
}
export default class RouteList {
    private externals;
    private validations;
    private statics;
    private routes;
    private events;
    /** List of Routes */
    constructor();
    /**
     * Add a new Event Response
     * @sync This Function adds an event handler syncronously
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
    /** The Async Code to run on a Request */ code: (ctr: Ctr) => Promise<any> | any): this;
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
    /** The Path Prefix */ prefix: string): RouteBlock;
    /**
   * Internal Method for Generating Routes Object
   * @sync This Function generates routes synchronously
   * @ignore This is meant for internal use
   * @since 3.1.0
  */
    getRoutes(): {
        events: Event[];
        routes: Route[];
        statics: Static[];
        validations: ((ctr: Ctr<any, false, any>) => any)[];
    };
}
