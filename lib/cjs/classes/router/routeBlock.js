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
var routeBlock_exports = {};
__export(routeBlock_exports, {
  default: () => RouteBlock
});
module.exports = __toCommonJS(routeBlock_exports);
var import_getAllFiles = require("../../misc/getAllFiles");
var import_router = require("../router");
var import_methods2 = __toESM(require("../../misc/methods"));
var path = __toESM(require("path"));
class RouteBlock {
  /** Generate Route Block */
  constructor(path2, authChecks) {
    this.path = (0, import_router.pathParser)(path2);
    this.routes = [];
    this.statics = [];
    this.authChecks = authChecks || [];
    this.externals = [];
  }
  /**
   * (Sync) Add Validation
   * @sync This Function adds Validation Syncronously
   * @example
   * ```
   * // The /api route will automatically check for correct credentials
   * // Obviously still putting the prefix (in this case / from the routeBlock in front)
   * // Please note that in order to respond unautorized the status cant be 2xx
   * const controller = new Webserver({ })
   * 
   * controller.prefix('/api')
   *   .validate(async(ctr) => {
   *     if (!ctr.headers.has('Authorization')) return ctr.status(401).print('Unauthorized')
   *     if (ctr.headers.get('Authorization') !== 'key123 or db request ig') return ctr.status(401).print('Unauthorized')
   * 
   *     return ctr.status(200)
   *   })
   *   .redirect('/pics', 'https://google.com/search?q=devil')
   * ```
   * @since 3.2.1
  */
  validate(code) {
    this.authChecks.push({ path: this.path, func: code });
    return this;
  }
  /**
   * (Sync) Add a Route
   * @sync This Function adds a Route Syncronously
   * @example
   * ```
   * // The /devil route will be available on "path + /devil" so "/devil"
   * // Paths wont collide if the request methods are different
   * const controller = new Webserver({ })
   * let devilsMessage = 'Im the one who knocks'
   * 
   * controller.prefix('/')
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
  add(method, path2, code) {
    if (!import_methods2.default.includes(method))
      throw TypeError(`No Valid Request Type: ${method}, Possible Values: ${import_methods2.default.join(", ")}`);
    if (this.routes.some((obj) => obj.method === method && obj.path === (0, import_router.pathParser)(path2)))
      return this;
    this.routes.push({
      method,
      path: (0, import_router.pathParser)(this.path + path2),
      pathArray: (0, import_router.pathParser)(this.path + path2).split("/"),
      code,
      data: {
        addTypes: false,
        authChecks: this.authChecks.map((check) => check.func)
      }
    });
    return this;
  }
  /**
   * (Sync) Add a Redirect
   * @sync This Function adds a Redirect Syncronously
   * @example
   * ```
   * // The /devil route will automatically redirect to google.com
   * // Obviously still putting the prefix (in this case / from the routeBlock in front)
   * const controller = new Webserver({ })
   * 
   * controller.prefix('/')
   *   .redirect('/devil', 'https://google.com')
   *   .redirect('/devilpics', 'https://google.com/search?q=devil')
   * ```
   * @since 3.1.0
  */
  redirect(request, redirect) {
    this.routes.push({
      method: "GET",
      path: (0, import_router.pathParser)(this.path + request),
      pathArray: (0, import_router.pathParser)(this.path + request).split("/"),
      code: (ctr) => ctr.redirect(redirect),
      data: {
        addTypes: false,
        authChecks: this.authChecks.map((check) => check.func)
      }
    });
    return this;
  }
  /**
   * (Sync) Load Static Files
   * @sync This Function loads the static files Syncronously
   * @warning If new Files are added the Server needs to be reloaded
   * @example
   * ```
   * // All Files in "./static" will be served dynamically so they wont be loaded as routes by default
   * // Due to the hideHTML Option being on files will be served differently, /index.html -> /; /about.html -> /about
   * const controller = new Webserver({ })
   * 
   * controller.prefix('/')
   *   .static('./static', {
   *     hideHTML: true, // If enabled will remove .html ending from files
   *     addTypes: true, // If enabled will automatically add content-types to some file endings
   *   })
   * ```
   * @since 3.1.0
  */
  static(folder, options) {
    var _a, _b;
    const addTypes = (_a = options == null ? void 0 : options.addTypes) != null ? _a : true;
    const hideHTML = (_b = options == null ? void 0 : options.hideHTML) != null ? _b : false;
    this.statics.push({
      path: (0, import_router.pathParser)(this.path),
      location: folder,
      data: {
        addTypes,
        hideHTML,
        authChecks: this.authChecks.map((check) => check.func)
      }
    });
    return this;
  }
  /**
   * (Sync) Load CJS Route Files
   * @async This Function loads the route files Asyncronously
   * @example
   * ```
   * // All Files in "./routes" ending with .js will be loaded as routes
   * const controller = new Webserver({ })
   * 
   * controller.prefix('/')
   *   .loadCJS('./routes')
   * ```
   * @since 3.1.0
  */
  async loadCJS(folder) {
    const files = (0, import_getAllFiles.getAllFilesFilter)(folder, "js");
    for (const file of files) {
      const route = require(path.resolve(file));
      if (!("path" in route) || !("method" in route) || !("code" in route))
        continue;
      if (!import_methods2.default.includes(route.method))
        throw TypeError(`No Valid Request Type: ${route.method}, Possible Values: ${import_methods2.default.join(", ")}`);
      this.routes.push({
        method: route.method,
        path: (0, import_router.pathParser)(this.path + route.path),
        pathArray: (0, import_router.pathParser)(this.path + route.path).split("/"),
        code: route.code,
        data: {
          addTypes: false,
          authChecks: this.authChecks.map((check) => check.func)
        }
      });
    }
    return this;
  }
  /**
   * (Async) Load ESM Route Files
   * @async This Function loads the route files Asyncronously
   * @example
   * ```
   * // All Files in "./routes" ending with .js will be loaded as routes
   * const controller = new Webserver({ })
   * 
   * controller.prefix('/')
   *   .loadESM('./routes')
   * ```
   * @since 4.0.0
  */
  async loadESM(folder) {
    const files = (0, import_getAllFiles.getAllFilesFilter)(folder, "js");
    for (const file of files) {
      const route = await import(path.resolve(file));
      if (!("path" in route) || !("method" in route) || !("code" in route))
        continue;
      if (!import_methods2.default.includes(route.method))
        throw TypeError(`No Valid Request Type: ${route.method}, Possible Values: ${import_methods2.default.join(", ")}`);
      this.routes.push({
        method: route.method,
        path: (0, import_router.pathParser)(this.path + route.path),
        pathArray: (0, import_router.pathParser)(this.path + route.path).split("/"),
        code: route.code,
        data: {
          addTypes: false,
          authChecks: this.authChecks.map((check) => check.func)
        }
      });
    }
    return this;
  }
  /**
   * Add a new Block of Routes with a Prefix
    * @sync This Function adds a sub-route block syncronously
   * @since 4.0.0
  */
  prefix(prefix) {
    const routeBlock = new RouteBlock(this.path + "/" + prefix, this.authChecks);
    this.externals.push({ method: "get", object: routeBlock });
    return routeBlock;
  }
  /**
   * Internal Method for Generating Routes Object
   * @sync This Function generates routes synchronously
   * @ignore This is meant for internal use
   * @since 3.1.0
  */
  get() {
    for (const external of this.externals) {
      const result = external.object[external.method]();
      this.routes.push(...result.routes);
      this.statics.push(...result.statics);
    }
    return { routes: this.routes, statics: this.statics, authChecks: this.authChecks };
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {});
