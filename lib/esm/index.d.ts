import routeList from "./classes/routeList";
import serverOptions, { Options } from "./classes/serverOptions";
import valueCollection from "./classes/valueCollection";
import typesEnum from "./interfaces/methods";
import ServerController from "./classes/serverController";
declare const _default: {
    /** The RouteList */ routeList: typeof routeList;
    /** The ServerOptions */ serverOptions: typeof serverOptions;
    /** The ValueCollection */ valueCollection: typeof valueCollection;
    /** The Request Types */ types: typeof typesEnum;
    /** Initialize The Webserver */
    initialize(options: Options): ServerController;
};
export = _default;
