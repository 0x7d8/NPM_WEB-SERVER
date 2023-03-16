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
var webServer_exports = {};
__export(webServer_exports, {
  default: () => Webserver
});
module.exports = __toCommonJS(webServer_exports);
var import_valueCollection = __toESM(require("./valueCollection"));
var import_serverOptions = __toESM(require("./serverOptions"));
var import_router = __toESM(require("./router"));
var import_handleHTTPRequest = __toESM(require("../functions/web/handleHTTPRequest"));
var import_getAllFiles = require("../misc/getAllFiles");
var import_fs = require("fs");
var import_http2 = __toESM(require("http2"));
var import_http = __toESM(require("http"));
class Webserver extends import_router.default {
  /**
   * Initialize a new Server
   * @example
   * ```
   * const controller = new Server({
   *   port: 8000
   * })
   * ```
   * @since 3.1.0
  */
  constructor(options) {
    super();
    this.globalContext = {
      controller: this,
      options: new import_serverOptions.default(options || {}).getOptions(),
      requests: {
        total: 0,
        0: 0,
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
        6: 0,
        7: 0,
        8: 0,
        9: 0,
        10: 0,
        11: 0,
        12: 0,
        13: 0,
        14: 0,
        15: 0,
        16: 0,
        17: 0,
        18: 0,
        19: 0,
        20: 0,
        21: 0,
        22: 0,
        23: 0
      },
      data: {
        incoming: {
          total: 0,
          0: 0,
          1: 0,
          2: 0,
          3: 0,
          4: 0,
          5: 0,
          6: 0,
          7: 0,
          8: 0,
          9: 0,
          10: 0,
          11: 0,
          12: 0,
          13: 0,
          14: 0,
          15: 0,
          16: 0,
          17: 0,
          18: 0,
          19: 0,
          20: 0,
          21: 0,
          22: 0,
          23: 0
        },
        outgoing: {
          total: 0,
          0: 0,
          1: 0,
          2: 0,
          3: 0,
          4: 0,
          5: 0,
          6: 0,
          7: 0,
          8: 0,
          9: 0,
          10: 0,
          11: 0,
          12: 0,
          13: 0,
          14: 0,
          15: 0,
          16: 0,
          17: 0,
          18: 0,
          19: 0,
          20: 0,
          21: 0,
          22: 0,
          23: 0
        }
      },
      routes: {
        normal: [],
        static: [],
        event: []
      },
      cache: {
        files: new import_valueCollection.default(),
        routes: new import_valueCollection.default()
      }
    };
    setInterval(() => {
      const previousHours = (0, import_handleHTTPRequest.getPreviousHours)();
      this.globalContext.requests[previousHours[0] - 1] = 0;
      this.globalContext.data.incoming[previousHours[0] - 1] = 0;
      this.globalContext.data.outgoing[previousHours[0] - 1] = 0;
    }, 3e5);
  }
  /**
   * Override the set Server Options
   * @example
   * ```
   * const controller = new Server({ })
   * 
   * controller.setOptions({
   *   port: 6900
   * })
   * ```
   * @since 3.1.0
  */
  setOptions(options) {
    this.globalContext.options = new import_serverOptions.default(options).getOptions();
    return this;
  }
  /**
   * Start the Server
   * @example
   * ```
   * const controller = new Server({ })
   * 
   * controller.start()
   *   .then((res) => {
   *     console.log(`Server started on port ${res.port}`)
   *   })
   *   .catch((err) => {
   *     console.error(err)
   *   })
   * ```
   * @since 3.1.0
  */
  start() {
    return new Promise(async (resolve, reject) => {
      let stopExecution = false;
      const loadedRoutes = await this.loadExternalPaths().catch((error) => {
        reject({ success: false, error, message: "WEBSERVER ERRORED" });
        stopExecution = true;
      });
      if (stopExecution)
        return;
      if (this.globalContext.options.https.enabled) {
        let key, cert;
        try {
          key = await import_fs.promises.readFile(this.globalContext.options.https.keyFile);
          cert = await import_fs.promises.readFile(this.globalContext.options.https.certFile);
        } catch (e) {
          throw new Error(`Cant access your HTTPS Key or Cert file! (${this.globalContext.options.https.keyFile} / ${this.globalContext.options.https.certFile})`);
        }
        this.server = import_http2.default.createSecureServer({
          key,
          cert,
          allowHTTP1: true
        });
      } else
        this.server = new import_http.default.Server();
      this.server.on("request", (req, res) => (0, import_handleHTTPRequest.default)(req, res, this.globalContext));
      this.globalContext.routes.normal = this.getRoutes().routes;
      this.globalContext.routes.event = this.getRoutes().events;
      this.globalContext.routes.static = this.getRoutes().statics;
      this.globalContext.routes.normal.push(...loadedRoutes);
      this.server.listen(this.globalContext.options.port, this.globalContext.options.bind);
      this.server.once("listening", () => resolve({ success: true, port: this.globalContext.options.port, message: "WEBSERVER STARTED" }));
      this.server.once("error", (error) => {
        this.server.close();
        reject({ success: false, error, message: "WEBSERVER ERRORED" });
      });
    });
  }
  /**
   * Reload the Server
   * @example
   * ```
   * const controller = new Server({ })
   * 
   * controller.reload()
   *   .then((res) => {
   *     console.log(`Server reloaded and started on port ${res.port}`)
   *   })
   *   .catch((err) => {
   *     console.error(err)
   *   })
   * ```
   * @since 3.1.0
  */
  async reload() {
    this.globalContext.cache.files.clear();
    this.globalContext.cache.routes.clear();
    this.globalContext.routes.normal = this.getRoutes().routes;
    this.globalContext.routes.event = this.getRoutes().events;
    this.globalContext.routes.static = this.getRoutes().statics;
    this.globalContext.routes.normal.push(...await this.loadExternalPaths());
    this.globalContext.data = {
      incoming: {
        total: 0,
        0: 0,
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
        6: 0,
        7: 0,
        8: 0,
        9: 0,
        10: 0,
        11: 0,
        12: 0,
        13: 0,
        14: 0,
        15: 0,
        16: 0,
        17: 0,
        18: 0,
        19: 0,
        20: 0,
        21: 0,
        22: 0,
        23: 0
      },
      outgoing: {
        total: 0,
        0: 0,
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
        6: 0,
        7: 0,
        8: 0,
        9: 0,
        10: 0,
        11: 0,
        12: 0,
        13: 0,
        14: 0,
        15: 0,
        16: 0,
        17: 0,
        18: 0,
        19: 0,
        20: 0,
        21: 0,
        22: 0,
        23: 0
      }
    };
    this.globalContext.requests = {
      total: 0,
      0: 0,
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
      6: 0,
      7: 0,
      8: 0,
      9: 0,
      10: 0,
      11: 0,
      12: 0,
      13: 0,
      14: 0,
      15: 0,
      16: 0,
      17: 0,
      18: 0,
      19: 0,
      20: 0,
      21: 0,
      22: 0,
      23: 0
    };
    await this.stop();
    await this.start();
    return this;
  }
  /**
   * Stop the Server
   * @example
   * ```
   * const controller = new Server({ })
   * 
   * controller.stop()
   *   .then((res) => {
   *     console.log('Server stopped')
   *   })
   *   .catch((err) => {
   *     console.error(err)
   *   })
   * ```
   * @since 3.1.0
  */
  stop() {
    this.server.close();
    this.globalContext.cache.files.clear();
    this.globalContext.cache.routes.clear();
    this.globalContext.routes.normal = this.getRoutes().routes;
    this.globalContext.routes.event = this.getRoutes().events;
    this.globalContext.routes.static = this.getRoutes().statics;
    this.globalContext.data = {
      incoming: {
        total: 0,
        0: 0,
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
        6: 0,
        7: 0,
        8: 0,
        9: 0,
        10: 0,
        11: 0,
        12: 0,
        13: 0,
        14: 0,
        15: 0,
        16: 0,
        17: 0,
        18: 0,
        19: 0,
        20: 0,
        21: 0,
        22: 0,
        23: 0
      },
      outgoing: {
        total: 0,
        0: 0,
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
        6: 0,
        7: 0,
        8: 0,
        9: 0,
        10: 0,
        11: 0,
        12: 0,
        13: 0,
        14: 0,
        15: 0,
        16: 0,
        17: 0,
        18: 0,
        19: 0,
        20: 0,
        21: 0,
        22: 0,
        23: 0
      }
    };
    this.globalContext.requests = {
      total: 0,
      0: 0,
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
      6: 0,
      7: 0,
      8: 0,
      9: 0,
      10: 0,
      11: 0,
      12: 0,
      13: 0,
      14: 0,
      15: 0,
      16: 0,
      17: 0,
      18: 0,
      19: 0,
      20: 0,
      21: 0,
      22: 0,
      23: 0
    };
    return new Promise((resolve, reject) => {
      this.server.once("close", () => resolve({ success: true, message: "WEBSERVER CLOSED" }));
      this.server.once("error", (error) => reject({ success: false, error, message: "WEBSERVER CLOSING ERRORED" }));
    });
  }
  /** Load all External Paths */
  async loadExternalPaths() {
    const loadedRoutes = [];
    for (const loadPath of this.getRoutes().loadPaths) {
      if (loadPath.type === "cjs") {
        for (const file of await (0, import_getAllFiles.getAllFilesFilter)(loadPath.path, "js")) {
          const route = require(file);
          if (!("method" in route) || !("path" in route) || !("code" in route))
            throw new Error(`Invalid Route at ${file}`);
          loadedRoutes.push({
            type: "route",
            method: route.method,
            path: loadPath.prefix + (0, import_router.pathParser)(route.path),
            pathArray: (loadPath.prefix + (0, import_router.pathParser)(route.path)).split("/"),
            code: route.code,
            data: {
              validations: loadPath.validations
            }
          });
        }
      } else {
        for (const file of await (0, import_getAllFiles.getAllFilesFilter)(loadPath.path, "js")) {
          const route = (await import(file)).default;
          if (!("method" in route) || !("path" in route) || !("code" in route))
            throw new Error(`Invalid Route at ${file}`);
          loadedRoutes.push({
            type: "route",
            method: route.method,
            path: loadPath.prefix + (0, import_router.pathParser)(route.path),
            pathArray: (loadPath.prefix + (0, import_router.pathParser)(route.path)).split("/"),
            code: route.code,
            data: {
              validations: loadPath.validations
            }
          });
        }
      }
    }
    return loadedRoutes;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {});
