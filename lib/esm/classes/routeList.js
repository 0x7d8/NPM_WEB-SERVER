import { getAllFiles, getAllFilesFilter } from "../misc/getAllFiles";
import types from "../misc/methods";
import RouteBlock from "./router/routeBlock";
import * as path from "path";
import * as fs from "fs";
const pathParser = (path2, removeSingleSlash) => {
  path2 = path2.replace(/\/{2,}/g, "/");
  if (path2.endsWith("/") && path2 !== "/")
    path2 = path2.slice(0, -1);
  if (!path2.startsWith("/") && path2 !== "/")
    path2 = `/${path2}`;
  if (path2.includes("/?"))
    path2 = path2.replace("/?", "?");
  return removeSingleSlash && path2 === "/" ? "" : path2;
};
class RouteList {
  /** List of Routes */
  constructor(routes, events) {
    routes = routes != null ? routes : [];
    events = events != null ? events : [];
    this.routes = routes;
    this.events = events;
    this.externals = [];
  }
  /**
   * Set An Event Manually
   */
  event(event2, code) {
    if (this.events.some((obj) => obj.event === event2))
      return false;
    return this.events.push({
      event: event2,
      code
    }) - 1;
  }
  /**
   * Set A Route Manually
   * @deprecated Please use the new Route Blocks instead, RouteList.routeBlock(path)
   */
  set(method, urlPath, code) {
    urlPath = pathParser(urlPath);
    if (!types.includes(method))
      throw TypeError(`No Valid Request Type: ${method}, Possible Values: ${types.join(", ")}`);
    if (this.routes.some((obj) => obj.method === method && obj.path === urlPath))
      return false;
    this.routes.push({
      method,
      path: urlPath,
      pathArray: urlPath.split("/"),
      code,
      data: {
        addTypes: false
      }
    });
    return this;
  }
  /**
   * Set A Route Block
   * @deprecated Please use the new Route Blocks instead, RouteList.routeBlock(path)
   */
  setBlock(prefix, routes) {
    prefix = pathParser(prefix);
    for (let routeNumber = 0; routeNumber <= routes.length - 1; routeNumber++) {
      const route2 = routes[routeNumber];
      this.routes.push({
        method: route2.method,
        path: `${prefix}${pathParser(route2.path, true)}`,
        pathArray: `${prefix}${pathParser(route2.path, true)}`.split("/"),
        code: route2.code,
        data: {
          addTypes: false
        }
      });
    }
    return this;
  }
  /**
   * Set Redirects Manually
   */
  setRedirects(redirects) {
    for (let redirectNumber = 0; redirectNumber <= redirects.length - 1; redirectNumber++) {
      const redirect = redirects[redirectNumber];
      this.routes.push({
        method: redirect.method,
        path: pathParser(redirect.path),
        pathArray: pathParser(redirect.path, true).split("/"),
        code: async (ctr2) => {
          return ctr2.redirect(redirect.destination);
        },
        data: {
          addTypes: false
        }
      });
    }
    return this;
  }
  /**
   * Create A new Route Block
   * @since 3.1.0
   */
  routeBlock(prefix) {
    const routeBlock = new RouteBlock(prefix);
    this.externals.push({ method: "get", object: routeBlock });
    return routeBlock;
  }
  /**
   * Serve Static Files
   * @deprecated Please use the new Route Blocks instead, RouteList.routeBlock(path)
   */
  static(urlPath, folder, options) {
    var _a, _b, _c;
    urlPath = pathParser(urlPath);
    const preload = (_a = options == null ? void 0 : options.preload) != null ? _a : false;
    const remHTML = (_b = options == null ? void 0 : options.remHTML) != null ? _b : false;
    const addTypes = (_c = options == null ? void 0 : options.addTypes) != null ? _c : true;
    for (const file of getAllFiles(folder)) {
      let newPath = file.replace(folder, "");
      if (remHTML)
        newPath = newPath.replace("/index.html", "/").replace(".html", "");
      const urlName = pathParser(newPath);
      const index = this.routes.push({
        method: "STATIC",
        path: urlName,
        pathArray: urlName.split("/"),
        code: async () => void 0,
        data: {
          addTypes,
          file
        }
      });
      if (preload)
        this.routes[index - 1].data.content = fs.readFileSync(file);
    }
    return this;
  }
  /**
   * Load External Function files
   * @deprecated Please use the new Route Blocks instead, RouteList.routeBlock(path).loadCJS()
   */
  load(folder) {
    const files = getAllFilesFilter(folder, ".js");
    for (const file of files) {
      const route2 = require(path.resolve(file));
      if (!("path" in route2) || !("method" in route2) || !("code" in route2))
        continue;
      if (!types.includes(route2.method))
        throw TypeError(`No Valid Request Type: ${route2.method}, Possible Values: ${types.join(", ")}`);
      this.routes.push({
        method: route2.method,
        path: pathParser(route2.path),
        pathArray: pathParser(route2.path).split("/"),
        code: route2.code,
        data: {
          addTypes: false
        }
      });
    }
    return this;
  }
  /**
   * Internal Function to access all Routes & Events as Array
   * @ignore This is only for internal use
   */
  list() {
    for (const external of this.externals) {
      this.routes.push(...external.object[external.method]());
    }
    return { routes: this.routes, events: this.events };
  }
}
export {
  RouteList as default,
  pathParser
};
