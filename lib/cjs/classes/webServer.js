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
var http = __toESM(require("http"));
class Webserver extends import_router.default {
  /** Server Controller */
  constructor(options) {
    super();
    this.globalContext = {
      controller: this,
      options: new import_serverOptions.default(options != null ? options : {}).getOptions(),
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
    this.server = new http.Server();
    this.server.on("request", async (req, res) => Promise.resolve((0, import_handleHTTPRequest.default)(req, res, this.globalContext)));
    setInterval(() => {
      const previousHours = (0, import_handleHTTPRequest.getPreviousHours)();
      this.globalContext.requests[previousHours[0] - 1] = 0;
      this.globalContext.data.incoming[previousHours[0] - 1] = 0;
      this.globalContext.data.outgoing[previousHours[0] - 1] = 0;
    }, 3e5);
  }
  /** Set new Options for the Server */
  setOptions(options) {
    this.globalContext.options = new import_serverOptions.default(options).getOptions();
    return this;
  }
  /** Start the Server */
  start() {
    this.globalContext.routes.normal = this.getRoutes().routes;
    this.globalContext.routes.event = this.getRoutes().events;
    this.globalContext.routes.static = this.getRoutes().statics;
    this.server.listen(this.globalContext.options.port, this.globalContext.options.bind);
    return new Promise((resolve, reject) => {
      this.server.once("listening", () => resolve({ success: true, port: this.globalContext.options.port, message: "WEBSERVER STARTED" }));
      this.server.once("error", (error) => {
        this.server.close();
        reject({ success: false, error, message: "WEBSERVER ERRORED" });
      });
    });
  }
  /** Load all Server Routes & Options */
  async reload(restartHTTP) {
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
    if (restartHTTP) {
      await this.stop();
      await this.start();
    }
    return this;
  }
  /** Stop the Server */
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
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {});
