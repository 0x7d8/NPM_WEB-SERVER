var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
import routeList, { pathParser } from "./classes/routeList";
import serverOptions from "./classes/serverOptions";
import valueCollection from "./classes/valueCollection";
import typesEnum from "./interfaces/methods";
import handleCompressType, { CompressMapping } from "./functions/handleCompressType";
import handleCompression from "./functions/handleCompression";
import ServerController from "./classes/serverController";
import { EventEmitter } from "stream";
import statsRoute from "./stats/routes";
import types from "./misc/methods";
import * as http from "http";
import * as https from "https";
import * as queryUrl from "querystring";
import * as zlib from "zlib";
import * as path from "path";
import * as url from "url";
import * as fs from "fs";
var require_src = __commonJS({
  "src/index.ts"(exports, module) {
    module.exports = {
      /** The RouteList */
      routeList,
      /** The ServerOptions */
      serverOptions,
      /** The ValueCollection */
      valueCollection,
      /** The Request Types */
      types: typesEnum,
      /** Initialize The Webserver */
      initialize(options) {
        options = new serverOptions(options).getOptions();
        let ctg = {
          controller: null,
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
          pageDisplay: "",
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
            event: []
          },
          cache: {
            files: new valueCollection(),
            routes: new valueCollection()
          }
        };
        const eventHandler = async (event, ctr2, ctx) => {
          switch (event) {
            case "error": {
              const event2 = ctg.routes.event.find((event3) => event3.event === "error");
              if (!event2) {
                console.log(ctr2.error);
                ctr2.status(500);
                ctx.content = Buffer.from(`An Error occured
${ctr2.error.stack}`);
              } else {
                Promise.resolve(event2.code(ctr2)).catch((e) => {
                  console.log(e);
                  ctr2.status(500);
                  ctx.content = Buffer.from(`An Error occured in your Error Event (what the hell?)
${e.stack}`);
                });
              }
            }
            case "request": {
              let errorStop = false;
              const event2 = ctg.routes.event.find((event3) => event3.event === "request");
              if (event2) {
                await Promise.resolve(event2.code(ctr2)).catch((e) => {
                  errorStop = true;
                  console.log(e);
                  ctr2.status(500);
                  ctx.content = Buffer.from(`An Error occured in your Request Event
${e.stack}`);
                });
              }
              ;
              return errorStop;
            }
            case "notfound": {
              let errorStop = false;
              const event2 = ctg.routes.event.find((event3) => event3.event === "notfound");
              if (!event2) {
                let pageDisplay = "";
                if (ctg.pageDisplay)
                  pageDisplay = ctg.pageDisplay;
                else {
                  for (const url2 of ctg.routes.normal) {
                    const type = url2.method === "STATIC" ? "GET" : url2.method;
                    pageDisplay += `[-] [${type}] ${url2.path}
`;
                  }
                  ;
                  ctg.pageDisplay = pageDisplay;
                }
                ctr2.status(404);
                ctx.content = Buffer.from(`[!] COULDNT FIND [${ctr2.url.method}]: ${ctr2.url.pathname.toUpperCase()}
[i] AVAILABLE PAGES:

${pageDisplay}`);
              } else {
                await Promise.resolve(event2.code(ctr2)).catch((e) => {
                  errorStop = true;
                  console.log(e);
                  ctr2.status(500);
                  ctx.content = Buffer.from(`An Error occured in your Notfound Event
${e.stack}`);
                });
              }
              ;
              return errorStop;
            }
          }
        };
        const getPreviousHours = () => {
          return Array.from({ length: 5 }, (_, i) => (new Date().getHours() - (4 - i) + 24) % 24);
        };
        setInterval(() => {
          const previousHours = getPreviousHours();
          ctg.requests[previousHours[0] - 1] = 0;
          ctg.data.incoming[previousHours[0] - 1] = 0;
          ctg.data.outgoing[previousHours[0] - 1] = 0;
        }, 3e5);
        let httpOptions = {};
        let key, cert;
        if (options.https.enabled) {
          try {
            key = fs.readFileSync(options.https.keyFile);
            cert = fs.readFileSync(options.https.certFile);
          } catch (e) {
            throw new Error(`Cant access your HTTPS Key or Cert file! (${options.https.keyFile} / ${options.https.certFile})`);
          }
          ;
          httpOptions = { key, cert };
        }
        const server = (options.https.enabled ? https : http).createServer(httpOptions, async (req, res) => {
          let ctx = {
            content: Buffer.from(""),
            compressed: false,
            events: new EventEmitter(),
            waiting: false,
            continue: true,
            execute: {
              route: null,
              static: false,
              exists: false,
              dashboard: false
            },
            body: {
              raw: Buffer.from(""),
              parsed: ""
            },
            url: { ...url.parse(pathParser(req.url)), method: req.method },
            previousHours: getPreviousHours()
          };
          ctx.events.on("noWaiting", () => ctx.waiting = false);
          res.once("close", () => ctx.events.emit("endRequest"));
          if (options.body.enabled)
            req.on("data", (data) => {
              ctx.body.raw = Buffer.concat([ctx.body.raw, Buffer.from(data)]);
              if (ctx.body.raw.byteLength >= options.body.maxSize * 1e6) {
                res.statusCode = 413;
                ctx.continue = false;
                switch (typeof options.body.message) {
                  case "object":
                    res.setHeader("Content-Type", "application/json");
                    ctx.content = Buffer.from(JSON.stringify(options.body.message));
                    break;
                  case "string":
                    ctx.content = Buffer.from(options.body.message);
                    break;
                  case "symbol":
                    ctx.content = Buffer.from(options.body.message.toString());
                    break;
                  case "bigint":
                  case "number":
                  case "boolean":
                    ctx.content = Buffer.from(String(options.body.message));
                    break;
                  case "undefined":
                    ctx.content = Buffer.from("");
                    break;
                }
                ;
                return handleCompression({ headers: new valueCollection(req.headers, decodeURIComponent), rawRes: res }, ctx, options);
              } else {
                ctg.data.incoming.total += ctx.body.raw.byteLength;
                ctg.data.incoming[ctx.previousHours[4]] += ctx.body.raw.byteLength;
              }
            }).on("end", () => {
              if (ctx.continue)
                ctx.events.emit("startRequest");
            });
          ctx.events.once("startRequest", async () => {
            var _a, _b;
            Object.keys(options.headers).forEach((key2) => {
              res.setHeader(key2, options.headers[key2]);
            });
            if (options.cors) {
              res.setHeader("Access-Control-Allow-Headers", "*");
              res.setHeader("Access-Control-Allow-Origin", "*");
              res.setHeader("Access-Control-Request-Method", "*");
              res.setHeader("Access-Control-Allow-Methods", types.join(","));
              if (req.method === "OPTIONS")
                return res.end("");
            }
            let params = {};
            const actualUrl = ctx.url.pathname.split("/");
            for (let urlNumber = 0; urlNumber <= ctg.routes.normal.length - 1; urlNumber++) {
              const url2 = ctg.routes.normal[urlNumber];
              if (ctg.cache.routes.has(`route::${ctx.url.pathname}`)) {
                const url3 = ctg.cache.routes.get(`route::${ctx.url.pathname}`);
                params = url3.params;
                ctx.execute.route = url3.route;
                ctx.execute.static = url3.route.method === "STATIC";
                ctx.execute.exists = true;
                break;
              }
              if (options.dashboard.enabled && (ctx.url.pathname === pathParser(options.dashboard.path) || ctx.url.pathname === pathParser(options.dashboard.path) + "/stats")) {
                ctx.execute.route = {
                  method: "GET",
                  path: url2.path,
                  pathArray: url2.path.split("/"),
                  code: async (ctr3) => await statsRoute(ctr3, ctg, ctx, options, ctg.routes.normal.length),
                  data: {
                    addTypes: false
                  }
                };
                ctx.execute.static = false;
                ctx.execute.exists = true;
                ctx.execute.dashboard = true;
                break;
              }
              if (url2.method !== "STATIC" && url2.method !== req.method)
                continue;
              if (url2.method === "STATIC" && req.method !== "GET")
                continue;
              if (url2.pathArray.length !== actualUrl.length)
                continue;
              if (ctx.execute.exists)
                break;
              if (url2.path === ctx.url.pathname && url2.method === req.method) {
                ctx.execute.route = url2;
                ctx.execute.exists = true;
                ctg.cache.routes.set(`route::${ctx.url.pathname}`, { route: url2, params: {} });
                break;
              }
              ;
              if (url2.path === ctx.url.pathname && url2.method === "STATIC") {
                ctx.execute.route = url2;
                ctx.execute.static = true;
                ctx.execute.exists = true;
                ctg.cache.routes.set(`route::${ctx.url.pathname}`, { route: url2, params: {} });
                break;
              }
              for (let partNumber = 0; partNumber <= url2.pathArray.length - 1; partNumber++) {
                const urlParam = url2.pathArray[partNumber];
                const reqParam = actualUrl[partNumber];
                if (!/^:.*:$/.test(urlParam) && reqParam !== urlParam)
                  break;
                else if (urlParam === reqParam)
                  continue;
                else if (/^:.*:$/.test(urlParam)) {
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
                ctg.cache.routes.set(`route::${ctx.url.pathname}`, { route: url2, params });
                break;
              }
              continue;
            }
            if (options.poweredBy)
              res.setHeader("X-Powered-By", "rjweb-server");
            let hostIp;
            if (options.proxy && req.headers["x-forwarded-for"])
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
              ctx.body.raw = await new Promise((resolve) => zlib.gunzip(ctx.body.raw, (error, content) => {
                if (error)
                  resolve(ctx.body.raw);
                else
                  resolve(content);
              }));
            if (options.body.parse) {
              try {
                JSON.parse(ctx.body.raw.toString());
              } catch (e) {
                ctx.body.parsed = ctx.body.raw.toString();
              }
            } else
              ctx.body.parsed = ctx.body.raw.toString();
            let ctr2 = {
              // Properties
              controller: ctg.controller,
              headers: new valueCollection(req.headers, decodeURIComponent),
              cookies: new valueCollection(cookies, decodeURIComponent),
              params: new valueCollection(params, decodeURIComponent),
              queries: new valueCollection(queryUrl.parse(ctx.url.query), decodeURIComponent),
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
              rawServer: server,
              rawReq: req,
              rawRes: res,
              // Custom Variables
              "@": {},
              // Functions
              setHeader(name, value) {
                res.setHeader(name, value);
                return ctr2;
              },
              setCustom(name, value) {
                ctr2["@"][name] = value;
                return ctr2;
              },
              redirect(location, statusCode) {
                res.statusCode = statusCode != null ? statusCode : 302;
                res.setHeader("Location", location);
                return ctr2;
              },
              print(msg, localOptions) {
                var _a2, _b2, _c;
                const niceJSON = (_a2 = localOptions == null ? void 0 : localOptions.niceJSON) != null ? _a2 : false;
                const contentType = (_b2 = localOptions == null ? void 0 : localOptions.contentType) != null ? _b2 : "";
                const returnFunctions = (_c = localOptions == null ? void 0 : localOptions.returnFunctions) != null ? _c : false;
                switch (typeof msg) {
                  case "object":
                    res.setHeader("Content-Type", "application/json");
                    if (niceJSON)
                      ctx.content = Buffer.from(JSON.stringify(msg, void 0, 1));
                    else
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
                        ctr2.print(result, { niceJSON, contentType });
                      else if (!returnFunctions) {
                        ctr2.error = new Error("Cant return functions from functions, consider using async/await");
                        return eventHandler("error", ctr2, ctx);
                      } else {
                        ctr2.print(result, { niceJSON, contentType, returnFunctions });
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
                ;
                return ctr2;
              },
              status(code) {
                res.statusCode = code != null ? code : 200;
                return ctr2;
              },
              printFile(file, localOptions) {
                var _a2, _b2, _c;
                const addTypes = (_a2 = localOptions == null ? void 0 : localOptions.addTypes) != null ? _a2 : true;
                const contentType = (_b2 = localOptions == null ? void 0 : localOptions.contentType) != null ? _b2 : "";
                const cache = (_c = localOptions == null ? void 0 : localOptions.cache) != null ? _c : false;
                if (addTypes && !contentType) {
                  if (file.endsWith(".pdf"))
                    ctr2.setHeader("Content-Type", "application/pdf");
                  if (file.endsWith(".js"))
                    ctr2.setHeader("Content-Type", "text/javascript");
                  if (file.endsWith(".html"))
                    ctr2.setHeader("Content-Type", "text/html");
                  if (file.endsWith(".css"))
                    ctr2.setHeader("Content-Type", "text/css");
                  if (file.endsWith(".csv"))
                    ctr2.setHeader("Content-Type", "text/csv");
                  if (file.endsWith(".mpeg"))
                    ctr2.setHeader("Content-Type", "video/mpeg");
                  if (file.endsWith(".mp4"))
                    ctr2.setHeader("Content-Type", "video/mp4");
                  if (file.endsWith(".webm"))
                    ctr2.setHeader("Content-Type", "video/webm");
                  if (file.endsWith(".bmp"))
                    ctr2.setHeader("Content-Type", "image/bmp");
                } else if (contentType)
                  res.setHeader("Content-Type", contentType);
                let stream, errorStop2 = false;
                if (ctr2.headers.get("accept-encoding").includes(CompressMapping[options.compression])) {
                  ctr2.rawRes.setHeader("Content-Encoding", CompressMapping[options.compression]);
                  ctr2.rawRes.setHeader("Vary", "Accept-Encoding");
                  ctx.continue = false;
                  if (ctg.cache.files.has(`file::${file}`)) {
                    ctg.data.outgoing.total += ctg.cache.files.get(`file::${file}`).byteLength;
                    ctg.data.outgoing[ctx.previousHours[4]] += ctg.cache.files.get(`file::${file}`).byteLength;
                    ctx.content = ctg.cache.files.get(`file::${file}`);
                    ctx.continue = true;
                    return ctr2;
                  } else if (ctg.cache.files.has(`file::${options.compression}::${file}`)) {
                    ctx.compressed = true;
                    ctg.data.outgoing.total += ctg.cache.files.get(`file::${options.compression}::${file}`).byteLength;
                    ctg.data.outgoing[ctx.previousHours[4]] += ctg.cache.files.get(`file::${options.compression}::${file}`).byteLength;
                    ctx.content = ctg.cache.files.get(`file::${options.compression}::${file}`);
                    ctx.continue = true;
                    return ctr2;
                  }
                  const compression = handleCompressType(options.compression);
                  try {
                    stream = fs.createReadStream(file);
                    ctx.waiting = true;
                    stream.pipe(compression);
                    compression.pipe(res);
                  } catch (e) {
                    errorStop2 = true;
                    ctr2.error = e;
                    eventHandler("error", ctr2, ctx);
                  }
                  if (errorStop2)
                    return;
                  compression.on("data", (content) => {
                    var _a3;
                    ctg.data.outgoing.total += content.byteLength;
                    ctg.data.outgoing[ctx.previousHours[4]] += content.byteLength;
                    if (cache) {
                      const oldData = (_a3 = ctg.cache.files.get(`file::${options.compression}::${file}`)) != null ? _a3 : Buffer.from("");
                      ctg.cache.files.set(`file::${options.compression}::${file}`, Buffer.concat([oldData, content]));
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
                    stream = fs.createReadStream(file);
                    ctx.waiting = true;
                    stream.pipe(res);
                  } catch (e) {
                    errorStop2 = true;
                    ctr2.error = e;
                    eventHandler("error", ctr2, ctx);
                  }
                  stream.on("data", (content) => {
                    var _a3;
                    ctg.data.outgoing.total += content.byteLength;
                    ctg.data.outgoing[ctx.previousHours[4]] += content.byteLength;
                    if (cache) {
                      const oldData = (_a3 = ctg.cache.files.get(`file::${options.compression}::${file}`)) != null ? _a3 : Buffer.from("");
                      ctg.cache.files.set(`file::${options.compression}::${file}`, Buffer.concat([oldData, content]));
                    }
                  });
                  stream.once("end", () => {
                    ctx.events.emit("noWaiting");
                    ctx.content = Buffer.from("");
                  });
                  res.once("close", () => stream.close());
                }
                return ctr2;
              }
            };
            let errorStop = false;
            if (!ctx.execute.dashboard)
              errorStop = await eventHandler("request", ctr2, ctx);
            if (errorStop)
              return;
            if (options.rateLimits.enabled) {
              for (const rule of options.rateLimits.list) {
                if (ctx.url.pathname.startsWith(rule.path)) {
                  res.setHeader("X-RateLimit-Limit", rule.times);
                  res.setHeader("X-RateLimit-Remaining", rule.times - ((_a = await options.rateLimits.functions.get(hostIp + rule.path)) != null ? _a : 0));
                  res.setHeader("X-RateLimit-Reset-Every", rule.timeout);
                  await options.rateLimits.functions.set(hostIp + rule.path, ((_b = await options.rateLimits.functions.get(hostIp + rule.path)) != null ? _b : 0) + 1);
                  setTimeout(async () => {
                    var _a2;
                    await options.rateLimits.functions.set(hostIp + rule.path, ((_a2 = await options.rateLimits.functions.get(hostIp + rule.path)) != null ? _a2 : 0) - 1);
                  }, rule.timeout);
                  if (await options.rateLimits.functions.get(hostIp + rule.path) > rule.times) {
                    res.statusCode = 429;
                    errorStop = true;
                    ctr2.print(options.rateLimits.message);
                    return handleCompression(ctr2, ctx, options);
                  }
                }
              }
            }
            if (options.dashboard.enabled && !ctx.execute.dashboard) {
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
              if (!ctx.execute.static) {
                await Promise.resolve(ctx.execute.route.code(ctr2)).catch((e) => {
                  ctr2.error = e;
                  errorStop = true;
                  eventHandler("error", ctr2, ctx);
                });
              } else {
                if (ctx.execute.route.data.addTypes) {
                  if (ctx.execute.route.path.endsWith(".pdf"))
                    ctr2.setHeader("Content-Type", "application/pdf");
                  if (ctx.execute.route.path.endsWith(".js"))
                    ctr2.setHeader("Content-Type", "text/javascript");
                  if (ctx.execute.route.path.endsWith(".html"))
                    ctr2.setHeader("Content-Type", "text/html");
                  if (ctx.execute.route.path.endsWith(".css"))
                    ctr2.setHeader("Content-Type", "text/css");
                  if (ctx.execute.route.path.endsWith(".csv"))
                    ctr2.setHeader("Content-Type", "text/csv");
                  if (ctx.execute.route.path.endsWith(".mpeg"))
                    ctr2.setHeader("Content-Type", "video/mpeg");
                  if (ctx.execute.route.path.endsWith(".mp4"))
                    ctr2.setHeader("Content-Type", "video/mp4");
                  if (ctx.execute.route.path.endsWith(".webm"))
                    ctr2.setHeader("Content-Type", "video/webm");
                  if (ctx.execute.route.path.endsWith(".bmp"))
                    ctr2.setHeader("Content-Type", "image/bmp");
                }
                ctx.continue = false;
                if (!("content" in ctx.execute.route.data)) {
                  const filePath = path.resolve(ctx.execute.route.data.file);
                  let stream, errorStop2 = false;
                  if (options.compression && String(ctr2.headers.get("accept-encoding")).includes(CompressMapping[options.compression])) {
                    ctr2.rawRes.setHeader("Content-Encoding", CompressMapping[options.compression]);
                    ctr2.rawRes.setHeader("Vary", "Accept-Encoding");
                    const compression = handleCompressType(options.compression);
                    try {
                      stream = fs.createReadStream(filePath);
                      ctx.waiting = true;
                      stream.pipe(compression);
                      compression.pipe(res);
                    } catch (e) {
                      errorStop2 = true;
                      ctr2.error = e;
                      eventHandler("error", ctr2, ctx);
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
                      stream = fs.createReadStream(filePath);
                      ctx.waiting = true;
                      stream.pipe(res);
                    } catch (e) {
                      errorStop2 = true;
                      ctr2.error = e;
                      eventHandler("error", ctr2, ctx);
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
                  ctg.data.outgoing.total += ctx.execute.route.data.content.byteLength;
                  ctg.data.outgoing[ctx.previousHours[4]] += ctx.execute.route.data.content.byteLength;
                  ctx.content = ctx.execute.route.data.content;
                }
              }
              await new Promise((resolve) => {
                if (!ctx.waiting)
                  return resolve(true);
                ctx.events.once("noWaiting", () => resolve(false));
              });
              if (ctx.content && ctx.continue) {
                ctg.data.outgoing.total += ctx.content.byteLength;
                ctg.data.outgoing[ctx.previousHours[4]] += ctx.content.byteLength;
                handleCompression(ctr2, ctx, options);
              } else
                res.end();
            } else {
              eventHandler("notfound", ctr2, ctx);
              await new Promise((resolve) => {
                if (!ctx.waiting)
                  return resolve(true);
                ctx.events.once("noWaiting", () => resolve(false));
              });
              if (ctx.content && ctx.continue) {
                ctg.data.outgoing.total += ctx.content.byteLength;
                ctg.data.outgoing[ctx.previousHours[4]] += ctx.content.byteLength;
                handleCompression(ctr2, ctx, options);
              } else
                res.end();
            }
          });
          if (!options.body.enabled)
            ctx.events.emit("startRequest");
        });
        ctg.controller = new ServerController(ctg, server, options);
        return ctg.controller;
      }
    };
  }
});
export default require_src();
