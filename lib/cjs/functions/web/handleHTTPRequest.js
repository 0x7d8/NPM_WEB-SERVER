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
var handleHTTPRequest_exports = {};
__export(handleHTTPRequest_exports, {
  default: () => handleHTTPRequest,
  getPreviousHours: () => getPreviousHours
});
module.exports = __toCommonJS(handleHTTPRequest_exports);
var import_router = require("../../classes/router");
var import_events = __toESM(require("events"));
var import_handleCompressType = __toESM(require("../handleCompressType"));
var import_valueCollection = __toESM(require("../../classes/valueCollection"));
var import_handleCompression = __toESM(require("../handleCompression"));
var import_routes = __toESM(require("../../stats/routes"));
var import_handleEvent = __toESM(require("../handleEvent"));
var import_handleContentType = __toESM(require("../handleContentType"));
var import_querystring = __toESM(require("querystring"));
var import_zlib = __toESM(require("zlib"));
var import_path = __toESM(require("path"));
var import_url = __toESM(require("url"));
var import_fs = __toESM(require("fs"));
const getPreviousHours = () => Array.from({ length: 5 }, (_, i) => ((/* @__PURE__ */ new Date()).getHours() - (4 - i) + 24) % 24);
async function handleHTTPRequest(req, res, ctg) {
  let ctx = {
    content: Buffer.alloc(0),
    compressed: false,
    events: new import_events.default(),
    waiting: false,
    continue: true,
    execute: {
      route: null,
      file: null,
      exists: false,
      dashboard: false
    },
    body: {
      chunks: [],
      raw: Buffer.alloc(0),
      parsed: ""
    },
    url: { ...import_url.default.parse((0, import_router.pathParser)(req.url)), method: req.method },
    previousHours: getPreviousHours()
  };
  ctx.url.pathname = decodeURI(ctx.url.pathname);
  ctx.events.on("noWaiting", () => ctx.waiting = false);
  req.once("close", () => ctx.events.emit("endRequest"));
  if (ctg.options.body.enabled)
    req.on("data", async (data) => {
      ctx.body.chunks.push(data);
      ctg.data.incoming.total += data.byteLength;
      ctg.data.incoming[ctx.previousHours[4]] += data.byteLength;
    }).once("end", () => {
      ctx.body.raw = Buffer.concat(ctx.body.chunks);
      ctx.body.chunks = [];
      if (ctx.body.raw.byteLength >= ctg.options.body.maxSize * 1e6) {
        res.statusCode = 413;
        ctx.continue = false;
        switch (typeof ctg.options.body.message) {
          case "object":
            res.setHeader("Content-Type", "application/json");
            ctx.content = Buffer.from(JSON.stringify(ctg.options.body.message));
            break;
          case "string":
            ctx.content = Buffer.from(ctg.options.body.message);
            break;
          case "symbol":
            ctx.content = Buffer.from(ctg.options.body.message.toString());
            break;
          case "bigint":
          case "number":
          case "boolean":
            ctx.content = Buffer.from(String(ctg.options.body.message));
            break;
          case "undefined":
            ctx.content = Buffer.from("");
            break;
        }
        ;
        return (0, import_handleCompression.default)({ headers: new import_valueCollection.default(req.headers, decodeURIComponent), rawRes: res }, ctx, ctg);
      }
      if (ctx.continue)
        ctx.events.emit("startRequest");
    });
  ctx.events.once("startRequest", async () => {
    var _a, _b;
    Object.keys(ctg.options.headers).forEach((key) => {
      res.setHeader(key, ctg.options.headers[key]);
    });
    if (ctg.options.cors) {
      res.setHeader("Access-Control-Allow-Headers", "*");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Request-Method", "*");
      res.setHeader("Access-Control-Allow-Methods", "*");
      if (req.method === "OPTIONS")
        return res.end("");
    }
    let params = {};
    const actualUrl = ctx.url.pathname.split("/");
    const foundStatic = (file, url2) => {
      ctx.execute.file = file;
      ctx.execute.route = url2;
      ctx.execute.exists = true;
    };
    for (let staticNumber = 0; staticNumber <= ctg.routes.static.length - 1; staticNumber++) {
      if (ctx.execute.exists)
        break;
      const url2 = ctg.routes.static[staticNumber];
      if (ctg.cache.routes.has(`route::static::${ctx.url.pathname}`)) {
        const url3 = ctg.cache.routes.get(`route::static::${ctx.url.pathname}`);
        ctx.execute.file = url3.file;
        ctx.execute.route = url3.route;
        ctx.execute.exists = true;
        break;
      }
      if (!ctx.url.pathname.startsWith(url2.path))
        continue;
      const urlPath = (0, import_router.pathParser)(ctx.url.pathname.replace(url2.path, "")).substring(1);
      const fileExists = async (location) => {
        location = import_path.default.resolve(location);
        try {
          const res2 = await import_fs.default.promises.stat(location);
          return res2.isFile();
        } catch (err) {
          return false;
        }
      };
      if (url2.data.hideHTML) {
        if (await fileExists(url2.location + "/" + urlPath + "/index.html"))
          foundStatic(import_path.default.resolve(url2.location + "/" + urlPath + "/index.html"), url2);
        else if (await fileExists(url2.location + "/" + urlPath + ".html"))
          foundStatic(import_path.default.resolve(url2.location + "/" + urlPath + ".html"), url2);
        else if (await fileExists(url2.location + "/" + urlPath))
          foundStatic(import_path.default.resolve(url2.location + "/" + urlPath), url2);
      } else if (await fileExists(url2.location + "/" + urlPath))
        foundStatic(import_path.default.resolve(url2.location + "/" + urlPath), url2);
    }
    if (ctg.options.dashboard.enabled && (ctx.url.pathname === (0, import_router.pathParser)(ctg.options.dashboard.path) || ctx.url.pathname === (0, import_router.pathParser)(ctg.options.dashboard.path) + "/stats")) {
      ctx.execute.route = {
        type: "route",
        method: "GET",
        path: ctx.url.path,
        pathArray: ctx.url.path.split("/"),
        code: async (ctr2) => await (0, import_routes.default)(ctr2, ctg, ctx),
        data: {
          validations: []
        }
      };
      ctx.execute.exists = true;
      ctx.execute.dashboard = true;
    }
    for (let urlNumber = 0; urlNumber <= ctg.routes.normal.length - 1; urlNumber++) {
      if (ctx.execute.exists)
        break;
      const url2 = ctg.routes.normal[urlNumber];
      if (ctg.cache.routes.has(`route::normal::${ctx.url.pathname}`)) {
        const url3 = ctg.cache.routes.get(`route::normal::${ctx.url.pathname}`);
        params = url3.params;
        ctx.execute.route = url3.route;
        ctx.execute.exists = true;
        break;
      }
      if (url2.method !== req.method)
        continue;
      if (url2.pathArray.length !== actualUrl.length)
        continue;
      if (url2.path === ctx.url.pathname && url2.method === req.method) {
        ctx.execute.route = url2;
        ctx.execute.exists = true;
        ctg.cache.routes.set(`route::normal::${ctx.url.pathname}`, { route: url2, params: {} });
        break;
      }
      for (let partNumber = 0; partNumber <= url2.pathArray.length - 1; partNumber++) {
        const urlParam = url2.pathArray[partNumber];
        const reqParam = actualUrl[partNumber];
        if (!/^<.*>$/.test(urlParam) && reqParam !== urlParam) {
          ctx.execute.exists = false;
          break;
        } else if (urlParam === reqParam)
          continue;
        else if (/^<.*>$/.test(urlParam)) {
          params[urlParam.substring(1, urlParam.length - 1)] = reqParam;
          ctx.execute.route = url2;
          ctx.execute.exists = true;
          continue;
        }
        ;
        continue;
      }
      ;
      if (ctx.execute.exists) {
        ctg.cache.routes.set(`route::normal::${ctx.url.pathname}`, { route: url2, params });
        break;
      }
      continue;
    }
    if (ctg.options.poweredBy)
      res.setHeader("X-Powered-By", "rjweb-server");
    let hostIp;
    if (ctg.options.proxy && req.headers["x-forwarded-for"])
      hostIp = req.headers["x-forwarded-for"];
    else
      hostIp = req.socket.remoteAddress;
    let cookies = {};
    if (req.headers.cookie)
      req.headers.cookie.split(";").forEach((cookie) => {
        const parts = cookie.split("=");
        cookies[parts.shift().trim()] = parts.join("=");
      });
    if (req.headers["content-encoding"] === "gzip")
      ctx.body.raw = await new Promise((resolve) => import_zlib.default.gunzip(ctx.body.raw, (error, content) => {
        if (error)
          resolve(ctx.body.raw);
        else
          resolve(content);
      }));
    if (ctg.options.body.parse) {
      try {
        ctx.body.parsed = JSON.parse(ctx.body.raw.toString());
      } catch (e) {
        ctx.body.parsed = ctx.body.raw.toString();
      }
    } else
      ctx.body.parsed = ctx.body.raw.toString();
    let ctr = {
      // Properties
      controller: ctg.controller,
      headers: new import_valueCollection.default(req.headers, decodeURIComponent),
      cookies: new import_valueCollection.default(cookies, decodeURIComponent),
      params: new import_valueCollection.default(params, decodeURIComponent),
      queries: new import_valueCollection.default(import_querystring.default.parse(ctx.url.query), decodeURIComponent),
      // Variables
      client: {
        userAgent: req.headers["user-agent"],
        httpVersion: req.httpVersion,
        port: req.socket.remotePort,
        ip: hostIp
      },
      body: ctx.body.parsed,
      url: ctx.url,
      // Raw Values
      rawReq: req,
      rawRes: res,
      // Custom Variables
      "@": {},
      // Functions
      setHeader(name, value) {
        res.setHeader(name, value);
        return ctr;
      },
      setCustom(name, value) {
        ctr["@"][name] = value;
        return ctr;
      },
      redirect(location, statusCode) {
        res.statusCode = statusCode != null ? statusCode : 302;
        res.setHeader("Location", location);
        ctx.events.emit("noWaiting");
        return ctr;
      },
      print(msg, options) {
        var _a2, _b2;
        const contentType = (_a2 = options == null ? void 0 : options.contentType) != null ? _a2 : "";
        const returnFunctions = (_b2 = options == null ? void 0 : options.returnFunctions) != null ? _b2 : false;
        ctx.events.emit("noWaiting");
        switch (typeof msg) {
          case "object":
            res.setHeader("Content-Type", "application/json");
            ctx.content = Buffer.from(JSON.stringify(msg));
            break;
          case "string":
            if (contentType)
              res.setHeader("Content-Type", contentType);
            ctx.content = Buffer.from(msg);
            break;
          case "symbol":
            if (contentType)
              res.setHeader("Content-Type", contentType);
            ctx.content = Buffer.from(msg.toString());
            break;
          case "bigint":
          case "number":
          case "boolean":
            if (contentType)
              res.setHeader("Content-Type", contentType);
            ctx.content = Buffer.from(String(msg));
            break;
          case "function":
            ctx.waiting = true;
            (async () => {
              const result = await msg();
              if (typeof result !== "function")
                ctr.print(result, { contentType });
              else if (!returnFunctions) {
                ctr.error = new Error("Cant return functions from functions, consider using async/await");
                return (0, import_handleEvent.default)("error", ctr, ctx, ctg);
              } else {
                ctr.print(result, { contentType, returnFunctions });
              }
              const parsedResult = ctx.content;
              ctx.content = parsedResult;
              ctx.events.emit("noWaiting");
            })();
            break;
          case "undefined":
            if (contentType)
              res.setHeader("Content-Type", contentType);
            ctx.content = Buffer.from("");
            break;
        }
        return ctr;
      },
      status(code) {
        res.statusCode = code != null ? code : 200;
        return ctr;
      },
      printFile(file, options) {
        var _a2, _b2, _c;
        const addTypes = (_a2 = options == null ? void 0 : options.addTypes) != null ? _a2 : true;
        const contentType = (_b2 = options == null ? void 0 : options.contentType) != null ? _b2 : "";
        const cache = (_c = options == null ? void 0 : options.cache) != null ? _c : false;
        if (addTypes && !contentType)
          ctr.setHeader("Content-Type", (0, import_handleContentType.default)(file, ctg));
        else if (contentType)
          res.setHeader("Content-Type", contentType);
        let stream, errorStop2 = false;
        if (ctr.headers.get("accept-encoding", "").includes(import_handleCompressType.CompressMapping[ctg.options.compression])) {
          ctr.rawRes.setHeader("Content-Encoding", import_handleCompressType.CompressMapping[ctg.options.compression]);
          ctr.rawRes.setHeader("Vary", "Accept-Encoding");
          ctx.continue = false;
          if (ctg.cache.files.has(`file::${file}`)) {
            ctg.data.outgoing.total += ctg.cache.files.get(`file::${file}`).byteLength;
            ctg.data.outgoing[ctx.previousHours[4]] += ctg.cache.files.get(`file::${file}`).byteLength;
            ctx.content = ctg.cache.files.get(`file::${file}`);
            ctx.continue = true;
            return ctr;
          } else if (ctg.cache.files.has(`file::${ctg.options.compression}::${file}`)) {
            ctx.compressed = true;
            ctg.data.outgoing.total += ctg.cache.files.get(`file::${ctg.options.compression}::${file}`).byteLength;
            ctg.data.outgoing[ctx.previousHours[4]] += ctg.cache.files.get(`file::${ctg.options.compression}::${file}`).byteLength;
            ctx.content = ctg.cache.files.get(`file::${ctg.options.compression}::${file}`);
            ctx.continue = true;
            return ctr;
          }
          const compression = (0, import_handleCompressType.default)(ctg.options.compression);
          try {
            stream = import_fs.default.createReadStream(file);
            ctx.waiting = true;
            stream.pipe(compression);
            compression.pipe(res);
          } catch (e) {
            errorStop2 = true;
            ctr.error = e;
            (0, import_handleEvent.default)("error", ctr, ctx, ctg);
          }
          if (errorStop2)
            return;
          compression.on("data", (content) => {
            var _a3;
            ctg.data.outgoing.total += content.byteLength;
            ctg.data.outgoing[ctx.previousHours[4]] += content.byteLength;
            if (cache) {
              const oldData = (_a3 = ctg.cache.files.get(`file::${ctg.options.compression}::${file}`)) != null ? _a3 : Buffer.from("");
              ctg.cache.files.set(`file::${ctg.options.compression}::${file}`, Buffer.concat([oldData, content]));
            }
          });
          compression.once("end", () => {
            ctx.events.emit("noWaiting");
            ctx.content = Buffer.from("");
          });
          res.once("close", () => {
            stream.close();
            compression.close();
          });
        } else {
          try {
            stream = import_fs.default.createReadStream(file);
            ctx.waiting = true;
            stream.pipe(res);
          } catch (e) {
            errorStop2 = true;
            ctr.error = e;
            (0, import_handleEvent.default)("error", ctr, ctx, ctg);
          }
          stream.on("data", (content) => {
            var _a3;
            ctg.data.outgoing.total += content.byteLength;
            ctg.data.outgoing[ctx.previousHours[4]] += content.byteLength;
            if (cache) {
              const oldData = (_a3 = ctg.cache.files.get(`file::${ctg.options.compression}::${file}`)) != null ? _a3 : Buffer.from("");
              ctg.cache.files.set(`file::${ctg.options.compression}::${file}`, Buffer.concat([oldData, content]));
            }
          });
          stream.once("end", () => {
            ctx.events.emit("noWaiting");
            ctx.content = Buffer.from("");
          });
          res.once("close", () => stream.close());
        }
        return ctr;
      },
      printStream(stream, endRequest) {
        ctx.waiting = true;
        stream.on("data", (data) => {
          res.write(data, "binary");
        }).once("close", () => {
          if (endRequest != null ? endRequest : true)
            ctx.events.emit("noWaiting");
        });
        return ctr;
      }
    };
    let errorStop = false;
    if (!ctx.execute.dashboard)
      errorStop = await (0, import_handleEvent.default)("request", ctr, ctx, ctg);
    if (errorStop)
      return;
    if (ctg.options.rateLimits.enabled) {
      for (const rule of ctg.options.rateLimits.list) {
        if (ctx.url.pathname.startsWith(rule.path)) {
          res.setHeader("X-RateLimit-Limit", rule.times);
          res.setHeader("X-RateLimit-Remaining", rule.times - ((_a = await ctg.options.rateLimits.functions.get(hostIp + rule.path)) != null ? _a : 0));
          res.setHeader("X-RateLimit-Reset-Every", rule.timeout);
          await ctg.options.rateLimits.functions.set(hostIp + rule.path, ((_b = await ctg.options.rateLimits.functions.get(hostIp + rule.path)) != null ? _b : 0) + 1);
          setTimeout(async () => {
            var _a2;
            await ctg.options.rateLimits.functions.set(hostIp + rule.path, ((_a2 = await ctg.options.rateLimits.functions.get(hostIp + rule.path)) != null ? _a2 : 0) - 1);
          }, rule.timeout);
          if (await ctg.options.rateLimits.functions.get(hostIp + rule.path) > rule.times) {
            res.statusCode = 429;
            errorStop = true;
            ctr.print(ctg.options.rateLimits.message);
            return (0, import_handleCompression.default)(ctr, ctx, ctg);
          }
        }
      }
    }
    if (ctx.execute.exists && ctx.execute.route.data.validations.length > 0) {
      let doContinue = true, runError = null;
      for (let authNumber = 0; authNumber <= ctx.execute.route.data.validations.length - 1; authNumber++) {
        const authCheck = ctx.execute.route.data.validations[authNumber];
        await Promise.resolve(authCheck(ctr)).then(() => {
          if (!String(res.statusCode).startsWith("2")) {
            doContinue = false;
          }
        }).catch((e) => {
          doContinue = false;
          runError = e;
        });
        if (!doContinue && runError) {
          ctr.error = runError;
          errorStop = true;
          (0, import_handleEvent.default)("error", ctr, ctx, ctg);
          break;
        } else if (!doContinue) {
          if (!res.getHeader("Content-Type"))
            ctr.setHeader("Content-Type", "text/plain");
          (0, import_handleCompression.default)(ctr, ctx, ctg);
          break;
        }
      }
      if (!doContinue)
        return;
    }
    if (ctg.options.dashboard.enabled && !ctx.execute.dashboard) {
      ctg.requests.total++;
      ctg.requests[ctx.previousHours[4]]++;
    }
    ;
    if (await new Promise((resolve) => {
      if (!ctx.waiting)
        return resolve(false);
      ctx.events.once("noWaiting", () => resolve(false));
      ctx.events.once("endRequest", () => resolve(true));
    }))
      return;
    if (ctx.execute.exists && !errorStop) {
      if (ctx.execute.route.type === "static") {
        if (ctx.execute.route.data.addTypes)
          res.setHeader("Content-Type", (0, import_handleContentType.default)(ctx.execute.file, ctg));
        ctx.continue = false;
        let stream, errorStop2 = false;
        if (ctg.options.compression && ctr.headers.get("accept-encoding", "").includes(import_handleCompressType.CompressMapping[ctg.options.compression])) {
          ctr.rawRes.setHeader("Content-Encoding", import_handleCompressType.CompressMapping[ctg.options.compression]);
          ctr.rawRes.setHeader("Vary", "Accept-Encoding");
          const compression = (0, import_handleCompressType.default)(ctg.options.compression);
          try {
            stream = import_fs.default.createReadStream(ctx.execute.file);
            ctx.waiting = true;
            stream.pipe(compression);
            compression.pipe(res);
          } catch (e) {
            errorStop2 = true;
            ctr.error = e;
            (0, import_handleEvent.default)("error", ctr, ctx, ctg);
          }
          if (errorStop2)
            return;
          compression.on("data", (content) => {
            ctg.data.outgoing.total += content.byteLength;
            ctg.data.outgoing[ctx.previousHours[4]] += content.byteLength;
          });
          compression.once("end", () => {
            ctx.events.emit("noWaiting");
            ctx.content = Buffer.from("");
          });
          res.once("close", () => {
            stream.close();
            compression.close();
          });
        } else {
          try {
            stream = import_fs.default.createReadStream(ctx.execute.file);
            ctx.waiting = true;
            stream.pipe(res);
          } catch (e) {
            errorStop2 = true;
            ctr.error = e;
            (0, import_handleEvent.default)("error", ctr, ctx, ctg);
          }
          stream.on("data", (content) => {
            ctg.data.outgoing.total += content.byteLength;
            ctg.data.outgoing[ctx.previousHours[4]] += content.byteLength;
          });
          stream.once("end", () => {
            ctx.events.emit("noWaiting");
            ctx.content = Buffer.from("");
          });
          res.once("close", () => stream.close());
        }
      } else {
        await Promise.resolve(ctx.execute.route.code(ctr)).catch((e) => {
          ctr.error = e;
          errorStop = true;
          (0, import_handleEvent.default)("error", ctr, ctx, ctg);
        });
      }
      await new Promise((resolve) => {
        if (!ctx.waiting)
          return resolve(true);
        ctx.events.once("noWaiting", () => resolve(false));
      });
      if (ctx.content && ctx.continue) {
        (0, import_handleCompression.default)(ctr, ctx, ctg);
      } else
        res.end();
    } else if (!errorStop) {
      (0, import_handleEvent.default)("notfound", ctr, ctx, ctg);
      await new Promise((resolve) => {
        if (!ctx.waiting)
          return resolve(true);
        ctx.events.once("noWaiting", () => resolve(false));
      });
      if (ctx.content && ctx.continue) {
        (0, import_handleCompression.default)(ctr, ctx, ctg);
      } else
        res.end();
    }
  });
  if (!ctg.options.body.enabled)
    ctx.events.emit("startRequest");
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  getPreviousHours
});
