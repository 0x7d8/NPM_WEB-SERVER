/// <reference types="node" />
import routeList from "./classes/routeList";
import serverOptions, { Options } from "./classes/serverOptions";
import valueCollection from "./classes/valueCollection";
import typesEnum from "./interfaces/types";
import * as http from "http";
declare const _default: {
    /** The RouteList */ routeList: typeof routeList;
    /** The ServerOptions */ serverOptions: typeof serverOptions;
    /** The ValueCollection */ valueCollection: typeof valueCollection;
    /** The Request Types */ types: typeof typesEnum;
    /** Start The Webserver */
    start(options: Options): Promise<{
        success: boolean;
        port?: number;
        error?: Error;
        message: string;
        rawServer?: http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>;
    }>;
};
export = _default;
