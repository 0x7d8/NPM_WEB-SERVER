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
var import_path = __toESM(require("./path"));
const pathParser = (path, removeSingleSlash) => {
  const paths = typeof path === "string" ? [path] : path;
  let output = "";
  for (let pathIndex = 0; pathIndex <= paths.length - 1; pathIndex++) {
    path = paths[pathIndex].replace(/\/{2,}/g, "/");
    if (path.endsWith("/") && path !== "/")
      path = path.slice(0, -1);
    if (!path.startsWith("/") && path !== "/")
      path = `/${path}`;
    if (path.includes("/?") && path.split("/").length > 2)
      path = path.replace("/?", "?");
    output += removeSingleSlash && path === "/" ? "" : path || "/";
  }
  return output.replace(/\/{2,}/g, "/");
};
class RouteList {
  /** List of Routes */
  constructor() {
    this.events = [];
    this.externals = [];
    this.middlewares = [];
  }
  /**
   * Add a new Event Response
   * @example
    * ```
    * // We will log every time a request is made
    * const controller = new Server({ })
    * 
    * controller.event('httpRequest', (ctr) => {
   *   console.log(`${ctr.url.method} Request made to ${ctr.url.path}`)
   * })
    * ```
   * @since 4.0.0
  */
  event(event, code) {
    if (this.events.some((obj) => obj.name === event))
      return this;
    this.events.push({
      name: event,
      code
    });
    return this;
  }
  /**
   * Add a new Middleware
   * @example
    * ```
    * // We will use the custom middleware
   * const middleware = require('middleware-package')
    * const controller = new Server({ })
    * 
    * controller.middleware(middleware())
    * ```
   * @since 4.4.0
  */
  middleware(middleware) {
    if (this.middlewares.some((obj) => obj.name === middleware.name))
      return this;
    this.middlewares.push(middleware);
    return this;
  }
  /**
   * Add a new Block of Routes with a Prefix
   * @example
    * ```
    * const controller = new Server({ })
    * 
    * controller.path('/', (path) => path
   *   .http('GET', '/cool', (ctr) => {
    *     ctr.print('cool!')
    *   })
   *   .path('/api', (path) => path
   *     .http('GET', '/', (ctr) => {
    *       ctr.print('Welcome to the API')
    *     })
   *   )
   * )
    * ```
   * @since 5.0.0
  */
  path(prefix, code) {
    const routePath = new import_path.default(prefix);
    this.externals.push({ method: "getRoutes", object: routePath });
    code(routePath);
    return this;
  }
  /**
    * Internal Method for Generating Routes Object
    * @ignore This is meant for internal use
    * @since 3.1.0
   */
  getRoutes() {
    const routes = [], statics = [], loadPaths = [];
    for (const external of this.externals) {
      const result = external.object[external.method]();
      routes.push(...result.routes);
      statics.push(...result.statics);
      loadPaths.push(...result.loadPaths);
    }
    return {
      events: this.events,
      routes,
      statics,
      loadPaths
    };
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  pathParser
});
