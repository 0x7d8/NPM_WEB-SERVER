import routeList from "./classes/routeList";
import serverOptions, { Options } from "./classes/serverOptions";
import valueCollection from "./classes/valueCollection";
import typesEnum from "./interfaces/methods";
import * as StartInterfaces from "./interfaces/startInterfaces";
declare const _default: {
    /** The RouteList */ routeList: typeof routeList;
    /** The ServerOptions */ serverOptions: typeof serverOptions;
    /** The ValueCollection */ valueCollection: typeof valueCollection;
    /** The Request Types */ types: typeof typesEnum;
    /** Start The Webserver */
    start(options: Options): Promise<StartInterfaces.Success>;
};
export = _default;
