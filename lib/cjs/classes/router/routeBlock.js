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
var import_routeList = require("../routeList");
var import_methods2 = __toESM(require("../../misc/methods"));
var path = __toESM(require("path"));
var fs = __toESM(require("fs"));
class RouteBlock {
  /** Generate Route Block */
  constructor(path2, authChecks) {
    this.path = (0, import_routeList.pathParser)(path2);
    this.data = [];
    this.authChecks = authChecks || [];
    this.externals = [];
  }
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
  auth(code) {
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
  add(method, path2, code) {
    if (!import_methods2.default.includes(method))
      throw TypeError(`No Valid Request Type: ${method}, Possible Values: ${import_methods2.default.join(", ")}`);
    if (this.data.some((obj) => obj.method === method && obj.path === (0, import_routeList.pathParser)(path2)))
      return this;
    this.data.push({
      method,
      path: (0, import_routeList.pathParser)(this.path + path2),
      pathArray: (0, import_routeList.pathParser)(this.path + path2).split("/"),
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
   * const routes = new webserver.routeList()
   * 
   * routes.routeBlock('/')
   *   .redirect('/devil', 'https://google.com')
   *   .redirect('/devilpics', 'https://google.com/search?q=devil')
   * ```
   * @since 3.1.0
   */
  redirect(request, redirect) {
    this.data.push({
      method: "GET",
      path: (0, import_routeList.pathParser)(this.path + request),
      pathArray: (0, import_routeList.pathParser)(this.path + request).split("/"),
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
  static(folder, options) {
    var _a, _b, _c;
    const addTypes = (_a = options == null ? void 0 : options.addTypes) != null ? _a : true;
    const hideHTML = (_b = options == null ? void 0 : options.hideHTML) != null ? _b : false;
    const preLoad = (_c = options == null ? void 0 : options.preLoad) != null ? _c : false;
    for (const file of (0, import_getAllFiles.getAllFiles)(folder)) {
      let newPath = file.replace(folder, "");
      if (hideHTML)
        newPath = newPath.replace("/index.html", "/").replace(".html", "");
      const index = this.data.push({
        method: "STATIC",
        path: (0, import_routeList.pathParser)(this.path + newPath),
        pathArray: (0, import_routeList.pathParser)(this.path + newPath).split("/"),
        code: () => {
        },
        data: {
          addTypes,
          file,
          authChecks: this.authChecks.map((check) => check.func)
        }
      });
      if (preLoad)
        this.data[index - 1].data.content = fs.readFileSync(file);
    }
    return this;
  }
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
  loadCJS(folder) {
    const files = (0, import_getAllFiles.getAllFilesFilter)(folder, ".js");
    for (const file of files) {
      const route = require(path.resolve(file));
      if (!("path" in route) || !("method" in route) || !("code" in route))
        continue;
      if (!import_methods2.default.includes(route.method))
        throw TypeError(`No Valid Request Type: ${route.method}, Possible Values: ${import_methods2.default.join(", ")}`);
      this.data.push({
        method: route.method,
        path: (0, import_routeList.pathParser)(this.path + route.path),
        pathArray: (0, import_routeList.pathParser)(this.path + route.path).split("/"),
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
  * Create A new Sub-Route Block
   * @sync This Function adds a sub-route block syncronously
  * @since 3.1.2
  */
  subRouteBlock(prefix) {
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
      this.data.push(...result.routes);
    }
    return { routes: this.data, events: this.data, authChecks: this.authChecks };
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {});
