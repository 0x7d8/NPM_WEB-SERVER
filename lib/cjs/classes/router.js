var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var router_exports = {};
__export(router_exports, {
  default: () => RouteList,
  pathParser: () => pathParser
});
module.exports = __toCommonJS(router_exports);
var import_routeBlock = __toESM(require("./router/routeBlock"));
const pathParser = (path, removeSingleSlash) => {
  path = path.replace(/\/{2,}/g, "/");
  if (path.endsWith("/") && path !== "/")
    path = path.slice(0, -1);
  if (!path.startsWith("/") && path !== "/")
    path = `/${path}`;
  if (path.includes("/?"))
    path = path.replace("/?", "?");
  return removeSingleSlash && path === "/" ? "" : path || "/";
};
class RouteList {
  /** List of Routes */
  constructor() {
    this.routes = [];
    this.events = [];
    this.loadPaths = [];
    this.externals = [];
  }
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
  event(event, code) {
    if (this.events.some((obj) => obj.event === event))
      return this;
    this.events.push({
      event,
      code
    });
    return this;
  }
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
  prefix(prefix) {
    const routeBlock = new import_routeBlock.default(prefix);
    this.externals.push({ method: "get", object: routeBlock });
    return routeBlock;
  }
  /**
    * Internal Method for Generating Routes Object
    * @sync This Function generates routes synchronously
    * @ignore This is meant for internal use
    * @since 3.1.0
   */
  getRoutes() {
    const routes = [], statics = [], loadPaths = [], validations = [];
    for (const external of this.externals) {
      const result = external.object[external.method]();
      routes.push(...result.routes);
      statics.push(...result.statics);
      loadPaths.push(...result.loadPaths);
      validations.push(...result.validations);
    }
    return {
      events: this.events,
      routes,
      statics,
      loadPaths,
      validations
    };
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  pathParser
});
