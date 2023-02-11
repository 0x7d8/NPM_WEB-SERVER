/// <reference types="node" />
/// <reference types="node" />
import * as ServerEvents from "../interfaces/serverEvents";
import { GlobalContext } from "../interfaces/context";
import { Options } from "./serverOptions";
import routeList from "./routeList";
import * as https from "https";
import * as http from "http";
export default class serverController {
    private globalContext;
    private optionsCache;
    private options;
    server: http.Server | https.Server;
    /** Server Controller */
    constructor(
    /** The Global Context */ globalContext: GlobalContext, 
    /** The HTTP / HTTPS Server */ server: http.Server | https.Server, 
    /** The Server Options */ options: Options);
    /** Set new Routes for the Server */
    setRoutes(
    /** The RouteList Class */ list: routeList): this;
    /** Set new Options for the Server */
    setOptions(
    /** The Options */ options: Partial<Options>): this;
    /** Start the Server */
    start(): Promise<ServerEvents.StartSuccess>;
    /** Load all Server Routes & Options */
    reload(): Promise<this>;
    /** Stop the Server */
    stop(): Promise<ServerEvents.StopSuccess>;
}
