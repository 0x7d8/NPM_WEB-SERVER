import { getAllFiles, getAllFilesFilter } from "../../misc/getAllFiles";
import { pathParser } from "../routeList";
import types from "../../misc/methods";
import * as path from "path";
import * as fs from "fs";
class RouteBlock {
  /** Generate Route Block */
  constructor(path2) {
    this.path = pathParser(path2, true);
    this.data = [];
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
    if (!types.includes(method))
      throw TypeError(`No Valid Request Type: ${method}, Possible Values: ${types.join(", ")}`);
    if (this.data.some((obj) => obj.method === method && obj.path === pathParser(path2)))
      return this;
    this.data.push({
      method,
      path: pathParser(this.path + path2),
      pathArray: pathParser(this.path + path2).split("/"),
      code,
      data: {
        addTypes: false
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
      path: pathParser(this.path + request),
      pathArray: pathParser(this.path + request).split("/"),
      code: (ctr) => ctr.redirect(redirect),
      data: {
        addTypes: false
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
   * // Due to the hideHTML Option being on files will be served differently, index.html -> /; about.html -> /about
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
    for (const file of getAllFiles(folder)) {
      let newPath = file.replace(folder, "");
      if (hideHTML)
        newPath = newPath.replace("/index.html", "/").replace(".html", "");
      const index = this.data.push({
        method: "STATIC",
        path: pathParser(this.path + newPath),
        pathArray: pathParser(this.path + newPath).split("/"),
        code: () => {
        },
        data: {
          addTypes,
          file
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
    const files = getAllFilesFilter(folder, ".js");
    for (const file of files) {
      const route = require(path.resolve(file));
      if (!("path" in route) || !("method" in route) || !("code" in route))
        continue;
      if (!types.includes(route.method))
        throw TypeError(`No Valid Request Type: ${route.method}, Possible Values: ${types.join(", ")}`);
      this.data.push({
        method: route.method,
        path: pathParser(this.path + route.path),
        pathArray: pathParser(this.path + route.path).split("/"),
        code: route.code,
        data: {
          addTypes: false
        }
      });
    }
    return this;
  }
  /**
   * Internal Method for Generating Routes Object
   * @ignore Please do not use
   */
  get() {
    return this.data;
  }
}
export {
  RouteBlock as default
};
