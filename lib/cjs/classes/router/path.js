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
var path_exports = {};
__export(path_exports, {
  default: () => RoutePath
});
module.exports = __toCommonJS(path_exports);
var import__ = require(".");
var import_methods = __toESM(require("../../misc/methods"));
var import_path = __toESM(require("path"));
var import_fs = __toESM(require("fs"));
class RoutePath {
  /** Generate Route Block */
  constructor(path2, validations) {
    this.httpPath = (0, import__.pathParser)(path2);
    this.routes = [];
    this.statics = [];
    this.loadPaths = [];
    this.validations = validations || [];
    this.externals = [];
  }
  /**
   * Add Validation
   * @example
   * ```
   * // The /api route will automatically check for correct credentials
   * // Obviously still putting the prefix (in this case / from the RoutePath in front)
   * // Please note that in order to respond unautorized the status cant be 2xx
   * const controller = new Server({ })
   * 
   * controller.path('/api', (path) => path
   *   .validate(async(ctr) => {
   *     if (!ctr.headers.has('Authorization')) return ctr.status(401).print('Unauthorized')
   *     if (ctr.headers.get('Authorization') !== 'key123 or db request ig') return ctr.status(401).print('Unauthorized')
   * 
   *     return ctr.status(200)
   *   })
   *   .redirect('/pics', 'https://google.com/search?q=devil')
   * )
   * ```
   * @since 3.2.1
  */
  validate(code) {
    this.validations.push(code);
    return this;
  }
  /**
   * Add a HTTP Route
   * @example
   * ```
   * // The /devil route will be available on "path + /devil" so "/devil"
   * // Paths wont collide if the request methods are different
   * const controller = new Server({ })
   * let devilsMessage = 'Im the one who knocks'
   * 
   * controller.path('/', (path) => path
   *   .http('GET', '/devil', async(ctr) => {
   *     return ctr
   *       .status(666)
   *       .print(devilsMessage)
   *   })
   *   .http('POST', '/devil', async(ctr) => {
   *     devilsMessage = ctr.body
   *     return ctr
   *       .status(999)
   *       .print('The Devils message was set')
   *   })
   * )
   * ```
   * @since 5.0.0
  */
  http(method, path2, code) {
    if (!import_methods.default.includes(method))
      throw TypeError(`No Valid Request Type: ${method}, Possible Values: ${import_methods.default.join(", ")}`);
    if (this.routes.some((obj) => obj.method === method && obj.path === (0, import__.pathParser)(path2)))
      return this;
    this.routes.push({
      type: "route",
      method,
      path: (0, import__.pathParser)(this.httpPath + path2),
      pathArray: (0, import__.pathParser)(this.httpPath + path2).split("/"),
      code,
      data: {
        validations: this.validations
      }
    });
    return this;
  }
  /**
   * Add a Redirect
   * @example
   * ```
   * // The /devil route will automatically redirect to google.com
   * // Obviously still putting the prefix (in this case / from the RoutePath in front)
   * const controller = new Server({ })
   * 
   * controller.path('/', (path) => path
   *   .redirect('/devil', 'https://google.com')
   *   .redirect('/devilpics', 'https://google.com/search?q=devil')
   * )
   * ```
   * @since 3.1.0
  */
  redirect(request, redirect) {
    this.routes.push({
      type: "route",
      method: "GET",
      path: (0, import__.pathParser)(this.httpPath + request),
      pathArray: (0, import__.pathParser)(this.httpPath + request).split("/"),
      code: (ctr) => ctr.redirect(redirect),
      data: {
        validations: this.validations
      }
    });
    return this;
  }
  /**
   * Serve Static Files
   * @example
   * ```
   * // All Files in "./static" will be served dynamically so they wont be loaded as routes by default
   * // Due to the hideHTML Option being on files will be served differently, /index.html -> /; /about.html -> /about; /contributors/index.html -> /contributors
   * const controller = new Server({ })
   * 
   * controller.path('/', (path) => path
   *   .static('./static', {
   *     hideHTML: true, // If enabled will remove .html ending from files
   *     addTypes: true, // If enabled will automatically add content-types to some file endings (including the custom ones defined in the main config)
   *   })
   * )
   * ```
   * @since 3.1.0
  */
  static(folder, options = {}) {
    var _a, _b;
    const addTypes = (_a = options == null ? void 0 : options.addTypes) != null ? _a : true;
    const hideHTML = (_b = options == null ? void 0 : options.hideHTML) != null ? _b : false;
    this.statics.push({
      type: "static",
      path: (0, import__.pathParser)(this.httpPath),
      location: folder,
      data: {
        addTypes,
        hideHTML,
        validations: this.validations
      }
    });
    return this;
  }
  /**
   * Load CJS Route Files
   * @example
   * ```
   * // All Files in "./routes" ending with .js will be loaded as routes
   * const controller = new Server({ })
   * 
   * controller.path('/', (path) => path
   *   .loadCJS('./routes')
   * )
   * ```
   * @since 3.1.0
  */
  loadCJS(folder) {
    if (!import_fs.default.existsSync(import_path.default.resolve(folder)))
      throw Error("The CJS Function folder wasnt found!");
    this.loadPaths.push({
      path: import_path.default.resolve(folder),
      prefix: this.httpPath,
      type: "cjs",
      validations: this.validations
    });
    return this;
  }
  /**
   * Load ESM Route Files
   * @example
   * ```
   * // All Files in "./routes" ending with .js will be loaded as routes
   * const controller = new Server({ })
   * 
   * controller.path('/', (path) => path
   *   .loadESM('./routes')
   * )
   * ```
   * @since 4.0.0
  */
  loadESM(folder) {
    if (!import_fs.default.existsSync(import_path.default.resolve(folder)))
      throw Error("The ESM Function folder wasnt found!");
    this.loadPaths.push({
      path: import_path.default.resolve(folder),
      prefix: this.httpPath,
      type: "esm",
      validations: this.validations
    });
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
    const routePath = new RoutePath(prefix, [...this.validations]);
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
    for (const external of this.externals) {
      const result = external.object[external.method]();
      this.routes.push(...result.routes);
      this.statics.push(...result.statics);
      this.loadPaths.push(...result.loadPaths);
    }
    return {
      routes: this.routes,
      statics: this.statics,
      loadPaths: this.loadPaths
    };
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {});
