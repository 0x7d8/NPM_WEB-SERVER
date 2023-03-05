import { pathParser } from "../../classes/router";
import EventEmitter from "events";
import handleCompressType, { CompressMapping } from "../handleCompressType";
import ValueCollection from "../../classes/valueCollection";
import handleCompression from "../handleCompression";
import statsRoute from "../../stats/routes";
import handleEvent from "../handleEvent";
import handleContentType from "../handleContentType";
import queryUrl from "querystring";
import zlib from "zlib";
import path from "path";
import url from "url";
import fs from "fs";
const getPreviousHours = () => Array.from({ length: 5 }, (_, i) => (new Date().getHours() - (4 - i) + 24) % 24);
async function handleHTTPRequest(req, res, ctg) {
  let ctx = {
    content: Buffer.alloc(0),
    compressed: false,
    events: new EventEmitter(),
    waiting: false,
    continue: true,
    execute: {
      route: null,
      file: null,
      static: false,
      exists: false,
      dashboard: false
    },
    body: {
      chunks: [],
      raw: Buffer.alloc(0),
      parsed: ""
    },
    url: { ...url.parse(pathParser(req.url)), method: req.method },
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
        return handleCompression({ headers: new ValueCollection(req.headers, decodeURIComponent), rawRes: res }, ctx, ctg);
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
      ctx.execute.static = true;
      ctx.execute.exists = true;
    };
    for (let staticNumber = 0; staticNumber <= ctg.routes.static.length - 1; staticNumber++) {
      const url2 = ctg.routes.static[staticNumber];
      if (ctg.cache.routes.has(`route::static::${ctx.url.pathname}`)) {
        const url3 = ctg.cache.routes.get(`route::static::${ctx.url.pathname}`);
        ctx.execute.file = url3.file;
        ctx.execute.route = url3.route;
        ctx.execute.static = true;
        ctx.execute.exists = true;
        break;
      }
      if (!ctx.url.pathname.startsWith(url2.path))
        continue;
      if (ctx.execute.exists)
        break;
      const urlPath = ctx.url.pathname.replace(url2.path, "").split("/");
      const file = urlPath.length > 1 ? urlPath.pop() : "";
      const folder = urlPath.join("/");
      const fileExists = async (location) => {
        location = path.resolve(location);
        try {
          const res2 = await fs.promises.stat(location);
          return res2.isFile();
        } catch (err) {
          return false;
        }
      };
      if (url2.data.hideHTML) {
        if (!file.endsWith(".html") && await fileExists(url2.location + "/" + folder + "/" + file))
          foundStatic(path.resolve(url2.location + "/" + folder + "/" + file), url2);
        else if (file && await fileExists(url2.location + "/" + folder + "/" + file + ".html"))
          foundStatic(path.resolve(url2.location + "/" + folder + "/" + file + ".html"), url2);
        else if (!file && await fileExists(url2.location + "/" + folder + "/index.html"))
          foundStatic(path.resolve(url2.location + "/" + folder + "/index.html"), url2);
      } else if (await fileExists(url2.location + "/" + folder + "/" + file))
        foundStatic(path.resolve(url2.location + "/" + folder + "/" + file), url2);
    }
    for (let urlNumber = 0; urlNumber <= ctg.routes.normal.length - 1; urlNumber++) {
      const url2 = ctg.routes.normal[urlNumber];
      if (ctg.cache.routes.has(`route::normal::${ctx.url.pathname}`)) {
        const url3 = ctg.cache.routes.get(`route::normal::${ctx.url.pathname}`);
        params = url3.params;
        ctx.execute.route = url3.route;
        ctx.execute.exists = true;
        break;
      }
      if (ctg.options.dashboard.enabled && (ctx.url.pathname === pathParser(ctg.options.dashboard.path) || ctx.url.pathname === pathParser(ctg.options.dashboard.path) + "/stats")) {
        ctx.execute.route = {
          method: "GET",
          path: url2.path,
          pathArray: url2.path.split("/"),
          code: async (ctr2) => await statsRoute(ctr2, ctg, ctx, ctg.routes.normal.length),
          data: {
            addTypes: false,
            authChecks: []
          }
        };
        ctx.execute.static = false;
        ctx.execute.exists = true;
        ctx.execute.dashboard = true;
        break;
      }
      if (url2.method !== req.method)
        continue;
      if (url2.pathArray.length !== actualUrl.length)
        continue;
      if (ctx.execute.exists)
        break;
      if (url2.path === ctx.url.pathname && url2.method === req.method) {
        ctx.execute.route = url2;
        ctx.execute.exists = true;
        ctg.cache.routes.set(`route::normal::${ctx.url.pathname}`, { route: url2, params: {} });
        break;
      }
      ;
      if (url2.path === ctx.url.pathname && url2.method === "STATIC") {
        ctx.execute.route = url2;
        ctx.execute.static = true;
        ctx.execute.exists = true;
        ctg.cache.routes.set(`route::normal::${ctx.url.pathname}`, { route: url2, params: {} });
        break;
      }
      for (let partNumber = 0; partNumber <= url2.pathArray.length - 1; partNumber++) {
        const urlParam = url2.pathArray[partNumber];
        const reqParam = actualUrl[partNumber];
        if (!/^<.*>$/.test(urlParam) && reqParam !== urlParam)
          break;
        else if (urlParam === reqParam)
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
      ctx.body.raw = await new Promise((resolve) => zlib.gunzip(ctx.body.raw, (error, content) => {
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
      headers: new ValueCollection(req.headers, decodeURIComponent),
      cookies: new ValueCollection(cookies, decodeURIComponent),
      params: new ValueCollection(params, decodeURIComponent),
      queries: new ValueCollection(queryUrl.parse(ctx.url.query), decodeURIComponent),
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
        return ctr;
      },
      print(msg, localOptions) {
        var _a2, _b2;
        const contentType = (_a2 = localOptions == null ? void 0 : localOptions.contentType) != null ? _a2 : "";
        const returnFunctions = (_b2 = localOptions == null ? void 0 : localOptions.returnFunctions) != null ? _b2 : false;
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
                return handleEvent("error", ctr, ctx, ctg);
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
        ;
        return ctr;
      },
      status(code) {
        res.statusCode = code != null ? code : 200;
        return ctr;
      },
      printFile(file, localOptions) {
        var _a2, _b2, _c;
        const addTypes = (_a2 = localOptions == null ? void 0 : localOptions.addTypes) != null ? _a2 : true;
        const contentType = (_b2 = localOptions == null ? void 0 : localOptions.contentType) != null ? _b2 : "";
        const cache = (_c = localOptions == null ? void 0 : localOptions.cache) != null ? _c : false;
        if (addTypes && !contentType)
          ctr.setHeader("Content-Type", handleContentType(ctx.execute.route.path));
        else if (contentType)
          res.setHeader("Content-Type", contentType);
        let stream, errorStop2 = false;
        if (ctr.headers.get("accept-encoding").includes(CompressMapping[ctg.options.compression])) {
          ctr.rawRes.setHeader("Content-Encoding", CompressMapping[ctg.options.compression]);
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
          const compression = handleCompressType(ctg.options.compression);
          try {
            stream = fs.createReadStream(file);
            ctx.waiting = true;
            stream.pipe(compression);
            compression.pipe(res);
          } catch (e) {
            errorStop2 = true;
            ctr.error = e;
            handleEvent("error", ctr, ctx, ctg);
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
            stream = fs.createReadStream(file);
            ctx.waiting = true;
            stream.pipe(res);
          } catch (e) {
            errorStop2 = true;
            ctr.error = e;
            handleEvent("error", ctr, ctx, ctg);
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
      }
    };
    let errorStop = false;
    if (!ctx.execute.dashboard)
      errorStop = await handleEvent("request", ctr, ctx, ctg);
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
            return handleCompression(ctr, ctx, ctg);
          }
        }
      }
    }
    if (ctx.execute.exists && ctx.execute.route.data.authChecks.length > 0) {
      let doContinue = true, runError = null;
      for (let authNumber = 0; authNumber <= ctx.execute.route.data.authChecks.length - 1; authNumber++) {
        const authCheck = ctx.execute.route.data.authChecks[authNumber];
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
          handleEvent("error", ctr, ctx, ctg);
          break;
        } else if (!doContinue) {
          if (!res.getHeader("Content-Type"))
            ctr.setHeader("Content-Type", "text/plain");
          handleCompression(ctr, ctx, ctg);
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
      if (!ctx.execute.static && "code" in ctx.execute.route) {
        await Promise.resolve(ctx.execute.route.code(ctr)).catch((e) => {
          ctr.error = e;
          errorStop = true;
          handleEvent("error", ctr, ctx, ctg);
        });
      } else {
        if (ctx.execute.route.data.addTypes)
          res.setHeader("Content-Type", handleContentType(ctx.execute.file));
        ctx.continue = false;
        let stream, errorStop2 = false;
        if (ctg.options.compression && String(ctr.headers.get("accept-encoding")).includes(CompressMapping[ctg.options.compression])) {
          ctr.rawRes.setHeader("Content-Encoding", CompressMapping[ctg.options.compression]);
          ctr.rawRes.setHeader("Vary", "Accept-Encoding");
          const compression = handleCompressType(ctg.options.compression);
          try {
            stream = fs.createReadStream(ctx.execute.file);
            ctx.waiting = true;
            stream.pipe(compression);
            compression.pipe(res);
          } catch (e) {
            errorStop2 = true;
            ctr.error = e;
            handleEvent("error", ctr, ctx, ctg);
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
            stream = fs.createReadStream(ctx.execute.file);
            ctx.waiting = true;
            stream.pipe(res);
          } catch (e) {
            errorStop2 = true;
            ctr.error = e;
            handleEvent("error", ctr, ctx, ctg);
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
      }
      await new Promise((resolve) => {
        if (!ctx.waiting)
          return resolve(true);
        ctx.events.once("noWaiting", () => resolve(false));
      });
      if (ctx.content && ctx.continue) {
        handleCompression(ctr, ctx, ctg);
      } else
        res.end();
    } else if (!errorStop) {
      handleEvent("notfound", ctr, ctx, ctg);
      await new Promise((resolve) => {
        if (!ctx.waiting)
          return resolve(true);
        ctx.events.once("noWaiting", () => resolve(false));
      });
      if (ctx.content && ctx.continue) {
        handleCompression(ctr, ctx, ctg);
      } else
        res.end();
    }
  });
  if (!ctg.options.body.enabled)
    ctx.events.emit("startRequest");
}
export {
  handleHTTPRequest as default,
  getPreviousHours
};
