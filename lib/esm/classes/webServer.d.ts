/// <reference types="node" />
/// <reference types="node" />
import * as ServerEvents from "../interfaces/serverEvents";
import { Options } from "./serverOptions";
import RouteList from "./router";
import http2 from "http2";
import http from "http";
export default class Webserver extends RouteList {
    private globalContext;
    server: http.Server | http2.Http2SecureServer;
    /** Server Controller */
    constructor(
    /** The Server Options */ options: Options);
    /** Set new Options for the Server */
    setOptions(
    /** The Options */ options: Options): this;
    /** Start the Server */
    start(): Promise<ServerEvents.StartSuccess>;
    /** Load all Server Routes & Options */
    reload(
    /** Whether to restart the HTTP Server itself */ restartHTTP?: boolean): Promise<this>;
    /**
     * Stop the Server
    */
    stop(): Promise<ServerEvents.StopSuccess>;
    private loadExternalPaths;
}
