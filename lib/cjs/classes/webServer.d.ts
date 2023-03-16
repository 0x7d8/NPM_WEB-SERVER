import * as ServerEvents from "../interfaces/serverEvents";
import { Options } from "./serverOptions";
import RouteList from "./router";
export default class Webserver extends RouteList {
    private globalContext;
    private server;
    /**
     * Initialize a new Server
     * @example
     * ```
     * const controller = new Server({
     *   port: 8000
     * })
     * ```
     * @since 3.1.0
    */
    constructor(
    /** The Server Options */ options?: Options);
    /**
     * Override the set Server Options
     * @example
     * ```
     * const controller = new Server({ })
     *
     * controller.setOptions({
     *   port: 6900
     * })
     * ```
     * @since 3.1.0
    */
    setOptions(
    /** The Options */ options: Options): this;
    /**
     * Start the Server
     * @example
     * ```
     * const controller = new Server({ })
     *
     * controller.start()
     *   .then((res) => {
     *     console.log(`Server started on port ${res.port}`)
     *   })
     *   .catch((err) => {
     *     console.error(err)
     *   })
     * ```
     * @since 3.1.0
    */
    start(): Promise<ServerEvents.StartSuccess>;
    /**
     * Reload the Server
     * @example
     * ```
     * const controller = new Server({ })
     *
     * controller.reload()
     *   .then((res) => {
     *     console.log(`Server reloaded and started on port ${res.port}`)
     *   })
     *   .catch((err) => {
     *     console.error(err)
     *   })
     * ```
     * @since 3.1.0
    */
    reload(): Promise<this>;
    /**
     * Stop the Server
     * @example
     * ```
     * const controller = new Server({ })
     *
     * controller.stop()
     *   .then((res) => {
     *     console.log('Server stopped')
     *   })
     *   .catch((err) => {
     *     console.error(err)
     *   })
     * ```
     * @since 3.1.0
    */
    stop(): Promise<ServerEvents.StopSuccess>;
    /** Load all External Paths */
    private loadExternalPaths;
}
