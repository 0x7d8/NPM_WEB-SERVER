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
export interface minifiedRedirect {
    /** The Request Method of the Redirect */ method: typesInterface;
    /** The Path on which this will be available */ path: string;
    /** The URL which it will send to */ destination: string;
}
export interface staticOptions {
    /**
     * Whether the files will be loaded into Memory
     * @default false
    */ preload?: boolean;
    /**
     * Whether .html & .htm endings will be removed automatically
     * @default false
    */ remHTML?: boolean;
    /**
     * Whether some Content Type Headers will be added automatically
     * @default true
    */ addTypes?: boolean;
}
export default class RouteList {
    private externals;
    private authChecks;
    private statics;
    private routes;
    private events;
    /** List of Routes */
    constructor();
    /**
     * Add a new Event Response
     * @since 4.0.0
    */
    event(
    /** The Event Name */ event: Events, 
    /** The Async Code to run on a Request */ code: (ctr: Ctr) => Promise<any>): number | false;
    /**
     * Add a new Block of Routes with a Prefix
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
        authChecks: {
            path: string;
            func: (ctr: Ctr<any, false, any>) => any;
        }[];
    };
}
