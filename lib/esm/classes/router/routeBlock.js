import { pathParser } from "../router";
import types from "../../misc/methods";
import path from "path";
import fs from "fs";
class RouteBlock {
  /** Generate Route Block */
  constructor(path2, validations) {
    this.path = pathParser(path2);
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
   * // Obviously still putting the prefix (in this case / from the routeBlock in front)
   * // Please note that in order to respond unautorized the status cant be 2xx
   * const controller = new Server({ })
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
    this.validations.push(code);
    return this;
  }
  /**
   * Add a Route
   * @example
   * ```
   * // The /devil route will be available on "path + /devil" so "/devil"
   * // Paths wont collide if the request methods are different
   * const controller = new Server({ })
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
    if (!types.includes(method))
      throw TypeError(`No Valid Request Type: ${method}, Possible Values: ${types.join(", ")}`);
    if (this.routes.some((obj) => obj.method === method && obj.path === pathParser(path2)))
      return this;
    this.routes.push({
      type: "route",
      method,
      path: pathParser(this.path + path2),
      pathArray: pathParser(this.path + path2).split("/"),
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
   * // Obviously still putting the prefix (in this case / from the routeBlock in front)
   * const controller = new Server({ })
   * 
   * controller.prefix('/')
   *   .redirect('/devil', 'https://google.com')
   *   .redirect('/devilpics', 'https://google.com/search?q=devil')
   * ```
   * @since 3.1.0
  */
  redirect(request, redirect) {
    this.routes.push({
      type: "route",
      method: "GET",
      path: pathParser(this.path + request),
      pathArray: pathParser(this.path + request).split("/"),
      code: (ctr) => ctr.redirect(redirect),
      data: {
        validations: this.validations
      }
    });
    return this;
  }
  /**
   * Load Static Files
   * @warning If new Files are added the Server needs to be reloaded
   * @example
   * ```
   * // All Files in "./static" will be served dynamically so they wont be loaded as routes by default
   * // Due to the hideHTML Option being on files will be served differently, /index.html -> /; /about.html -> /about
   * const controller = new Server({ })
   * 
   * controller.prefix('/')
   *   .static('./static', {
   *     hideHTML: true, // If enabled will remove .html ending from files
   *     addTypes: true, // If enabled will automatically add content-types to some file endings
   *   })
   * ```
   * @since 3.1.0
  */
  static(folder, options = {}) {
    var _a, _b;
    const addTypes = (_a = options == null ? void 0 : options.addTypes) != null ? _a : true;
    const hideHTML = (_b = options == null ? void 0 : options.hideHTML) != null ? _b : false;
    this.statics.push({
      type: "static",
      path: pathParser(this.path),
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
   * controller.prefix('/')
   *   .loadCJS('./routes')
   * ```
   * @since 3.1.0
  */
  loadCJS(folder) {
    if (!fs.existsSync(path.resolve(folder)))
      throw Error("The CJS Function folder wasnt found!");
    this.loadPaths.push({
      path: path.resolve(folder),
      prefix: this.path,
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
   * controller.prefix('/')
   *   .loadESM('./routes')
   * ```
   * @since 4.0.0
  */
  loadESM(folder) {
    if (!fs.existsSync(path.resolve(folder)))
      throw Error("The ESM Function folder wasnt found!");
    this.loadPaths.push({
      path: path.resolve(folder),
      prefix: this.path,
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
    const routeBlock = new RouteBlock(this.path + "/" + prefix, this.validations);
    this.externals.push({ method: "get", object: routeBlock });
    return routeBlock;
  }
  /**
   * Internal Method for Generating Routes Object
   * @ignore This is meant for internal use
   * @since 3.1.0
  */
  get() {
    for (const external of this.externals) {
      const result = external.object[external.method]();
      this.routes.push(...result.routes);
      this.statics.push(...result.statics);
      this.loadPaths.push(...result.loadPaths);
    }
    return {
      routes: this.routes,
      statics: this.statics,
      loadPaths: this.loadPaths,
      validations: this.validations
    };
  }
}
export {
  RouteBlock as default
};
