import { Types as typesInterface } from "../interfaces/methods";
import route from "../interfaces/route";
import event, { Events as eventsType } from "../interfaces/event";
import ctr from "../interfaces/ctr";
import RouteBlock from "./router/routeBlock";
export declare const pathParser: (path: string, removeSingleSlash?: boolean) => string;
export interface minifiedRoute {
    /** The Request Method of the Route */ method: typesInterface;
    /** The Path on which this will be available (+ prefix) */ path: string;
    /** The Async Code to run on a Request */ code: (ctr: ctr) => Promise<any>;
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
    private routes;
    private events;
    /** List of Routes */
    constructor(
    /**
     * Routes to Import
     * @default []
     */ routes?: route[], 
    /**
     * Events to Import
     * @default []
     */ events?: event[]);
    /**
     * Set An Event Manually
     */
    event(
    /** The Event Name */ event: eventsType, 
    /** The Async Code to run on a Request */ code: (ctr: ctr) => Promise<any>): number | false;
    /**
     * Set A Route Manually
     * @deprecated Please use the new Route Blocks instead, RouteList.routeBlock(path)
     */
    set(
    /** The Request Method */ method: typesInterface, 
    /** The Path on which this will be available */ urlPath: string, 
    /** The Async Code to run on a Request */ code: (ctr: ctr) => Promise<any>): false | this;
    /**
     * Set A Route Block
     * @deprecated Please use the new Route Blocks instead, RouteList.routeBlock(path)
     */
    setBlock(
    /** The Path Prefix */ prefix: string, 
    /** The Routes */ routes: minifiedRoute[]): this;
    /**
     * Set Redirects Manually
     */
    setRedirects(
    /** The Redirects */ redirects: minifiedRedirect[]): this;
    /**
     * Create A new Route Block
     * @since 3.1.0
     */
    routeBlock(
    /** The Path Prefix */ prefix: string): RouteBlock;
    /**
     * Serve Static Files
     * @deprecated Please use the new Route Blocks instead, RouteList.routeBlock(path)
     */
    static(
    /** The Path to serve the Files on */ urlPath: string, 
    /** The Location of the Folder to load from */ folder: string, 
    /** Additional Options */ options?: staticOptions): this;
    /**
     * Load External Function files
     * @deprecated Please use the new Route Blocks instead, RouteList.routeBlock(path).loadCJS()
     */
    load(
    /** The Location of the Folder to load from */ folder: string): this;
    /**
     * Internal Function to access all Routes & Events as Array
     * @ignore This is only for internal use
     */
    list(): {
        routes: route[];
        events: event[];
        authChecks: {
            path: string;
            func: (ctr: ctr<any, false, any>) => any;
        }[];
    };
}
