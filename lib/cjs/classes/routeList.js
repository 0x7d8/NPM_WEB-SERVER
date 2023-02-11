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
var routeList_exports = {};
__export(routeList_exports, {
  default: () => routeList,
  pathParser: () => pathParser
});
module.exports = __toCommonJS(routeList_exports);
var import_getAllFiles = require("../misc/getAllFiles");
var import_methods2 = __toESM(require("../misc/methods"));
var path = __toESM(require("path"));
var fs = __toESM(require("fs"));
const pathParser = (path2, removeSingleSlash) => {
  path2 = path2.replace(/\/{2,}/g, "/");
  if (path2.endsWith("/") && path2 !== "/")
    return path2.slice(0, -1);
  if (!path2.startsWith("/") && path2 !== "/")
    return `/${path2}`;
  if (path2.includes("/?"))
    return path2.replace("/?", "?");
  return removeSingleSlash && path2 === "/" ? "" : path2;
};
class routeList {
  /** List of Routes */
  constructor(routes, events) {
    routes = routes != null ? routes : [];
    events = events != null ? events : [];
    this.routes = routes;
    this.events = events;
  }
  /** Set An Event Manually */
  event(event2, code) {
    if (this.events.some((obj) => obj.event === event2))
      return false;
    return this.events.push({
      event: event2,
      code
    }) - 1;
  }
  /** Set A Route Manually */
  set(method, urlPath, code) {
    urlPath = pathParser(urlPath);
    if (!import_methods2.default.includes(method))
      throw TypeError(`No Valid Request Type: ${method}, Possible Values: ${import_methods2.default.join(", ")}`);
    if (this.routes.some((obj) => obj.method === method && obj.path === urlPath))
      return false;
    return this.routes.push({
      method,
      path: urlPath,
      pathArray: urlPath.split("/"),
      code,
      data: {
        addTypes: false
      }
    }) - 1;
  }
  /** Set A Route Block Manually */
  setBlock(prefix, routes) {
    prefix = pathParser(prefix);
    let arrayIndexes = [];
    for (let routeNumber = 0; routeNumber <= routes.length - 1; routeNumber++) {
      const route2 = routes[routeNumber];
      arrayIndexes.push(this.routes.push({
        method: route2.method,
        path: `${prefix}${pathParser(route2.path, true)}`,
        pathArray: `${prefix}${pathParser(route2.path, true)}`.split("/"),
        code: route2.code,
        data: {
          addTypes: false
        }
      }) - 1);
    }
    ;
    return arrayIndexes;
  }
  /** Set Redirects Manually */
  setRedirects(redirects) {
    let arrayIndexes = [];
    for (let redirectNumber = 0; redirectNumber <= redirects.length - 1; redirectNumber++) {
      const redirect = redirects[redirectNumber];
      arrayIndexes.push(this.routes.push({
        method: redirect.method,
        path: pathParser(redirect.path),
        pathArray: pathParser(redirect.path, true).split("/"),
        code: async (ctr2) => {
          return ctr2.redirect(redirect.destination);
        },
        data: {
          addTypes: false
        }
      }) - 1);
    }
    ;
    return arrayIndexes;
  }
  /** Serve Static Files */
  static(urlPath, folder, options) {
    var _a, _b, _c;
    urlPath = pathParser(urlPath);
    const preload = (_a = options == null ? void 0 : options.preload) != null ? _a : false;
    const remHTML = (_b = options == null ? void 0 : options.remHTML) != null ? _b : false;
    const addTypes = (_c = options == null ? void 0 : options.addTypes) != null ? _c : true;
    let arrayIndexes = [];
    for (const file of (0, import_getAllFiles.getAllFiles)(folder)) {
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
      arrayIndexes.push(index - 1);
    }
    ;
    return arrayIndexes;
  }
  /** Load External Function Files */
  load(folder) {
    const files = (0, import_getAllFiles.getAllFilesFilter)(folder, ".js");
    let arrayIndexes = [];
    for (const file of files) {
      const route2 = require(path.resolve(file));
      if (!("path" in route2) || !("method" in route2) || !("code" in route2))
        continue;
      if (!import_methods2.default.includes(route2.method))
        throw TypeError(`No Valid Request Type: ${route2.method}, Possible Values: ${import_methods2.default.join(", ")}`);
      arrayIndexes.push(this.routes.push({
        method: route2.method,
        path: pathParser(route2.path),
        pathArray: pathParser(route2.path).split("/"),
        code: route2.code,
        data: {
          addTypes: false
        }
      }) - 1);
    }
    ;
    return arrayIndexes;
  }
  /** Internal Function to access all Routes & Events as Array */
  list() {
    return { routes: this.routes, events: this.events };
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  pathParser
});
