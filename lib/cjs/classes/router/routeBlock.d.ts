import { Types as typesInterface } from "../../interfaces/methods";
import Route from "../../interfaces/route";
import Ctr from "../../interfaces/ctr";
export default class RouteBlock {
    private externals;
    private authChecks;
    private data;
    private path;
    /** Generate Route Block */
    constructor(
    /** The Path of the Routes */ path: string, 
    /** The Authchecks to add */ authChecks?: {
        path: string;
        func: (ctr: Ctr) => Promise<any> | any;
    }[]);
    /**
     * (Sync) Add Authentication
     * @sync This Function adds Authentication Syncronously
     * @example
     * ```
     * // The /api route will automatically check for authentication
     * // Obviously still putting the prefix (in this case / from the routeBlock in front)
     * // Please note that in order to respond unautorized the status cant be 2xx
     * const routes = new webserver.routeList()
     *
     * routes.routeBlock('/api')
     *   .auth(async(ctr) => {
     *     if (!ctr.headers.has('Authorization')) return ctr.status(401).print('Unauthorized')
     *     if (ctr.headers.get('Authorization') !== 'key123 or db request ig') return ctr.status(401).print('Unauthorized')
     *
     *     return ctr.status(200)
     *   })
     *   .redirect('/pics', 'https://google.com/search?q=devil')
     * ```
     * @since 3.1.1
     */
    auth(
    /** The Function to Validate Authorization */ code: (ctr: Ctr) => Promise<any> | any): this;
    /**
     * (Sync) Add a Route
     * @sync This Function adds a Route Syncronously
     * @example
     * ```
     * // The /devil route will be available on "path + /devil" so "/devil"
     * // Paths wont collide if the request methods are different
     * const routes = new webserver.routeList()
     * let devilsMessage = 'Im the one who knocks'
     *
     * routes.routeBlock('/')
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
    /** The Async Code to run on a Request */ code: (ctr: Ctr) => Promise<any> | any): this;
    /**
     * (Sync) Add a Redirect
     * @sync This Function adds a Redirect Syncronously
     * @example
     * ```
     * // The /devil route will automatically redirect to google.com
     * // Obviously still putting the prefix (in this case / from the routeBlock in front)
     * const routes = new webserver.routeList()
     *
     * routes.routeBlock('/')
     *   .redirect('/devil', 'https://google.com')
     *   .redirect('/devilpics', 'https://google.com/search?q=devil')
     * ```
     * @since 3.1.0
     */
    redirect(
    /** The Request Path to Trigger the Redirect on */ request: string, 
    /** The Redirect Path to Redirect to */ redirect: string): this;
    /**
     * (Sync) Load Static Files
     * @sync This Function loads the static files Syncronously
     * @warning If new Files are added the Server needs to be reloaded
     * @example
     * ```
     * // All Files in "./static" will be served dynamically so they wont be loaded as routes by default
     * // Due to the hideHTML Option being on files will be served differently, /index.html -> /; /about.html -> /about
     * const routes = new webserver.routeList()
     *
     * routes.routeBlock('/')
     *   .static('./static', {
     *     hideHTML: true, // If enabled will remove .html ending from files
     *     preLoad: false, // If enabled will load files into RAM instead of dynamically loading them
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
         */ addTypes?: boolean;
        /**
         * Automatically remove .html ending from files
         * @default false
         * @since 3.1.0
         */ hideHTML?: boolean;
        /**
         * Automatically load files into RAM instead of dynamically loading them
         * @default false
         * @since 3.1.0
         */ preLoad?: boolean;
    }): this;
    /**
     * (Sync) Load CJS Route Files
     * @sync This Function loads the route files Syncronously
     * @example
     * ```
     * // All Files in "./routes" ending with .js will be loaded as routes
     * const routes = new webserver.routeList()
     *
     * routes.routeBlock('/')
     *   .loadCJS('./static')
     * ```
     * @since 3.1.0
     */
    loadCJS(
    /** The Folder which will be used */ folder: string): this;
    /**
       * Create A new Sub-Route Block
     * @sync This Function adds a sub-route block syncronously
       * @since 3.1.2
       */
    subRouteBlock(
    /** The Path Prefix */ prefix: string): RouteBlock;
    /**
     * Internal Method for Generating Routes Object
     * @sync This Function generates routes synchronously
     * @ignore This is meant for internal use
     * @since 3.1.0
     */
    get(): {
        routes: Route[];
        events: Route[];
        authChecks: {
            path: string;
            func: (ctr: Ctr<any, false, any>) => any;
        }[];
    };
}
