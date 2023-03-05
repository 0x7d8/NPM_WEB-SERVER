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
var routes_exports = {};
__export(routes_exports, {
  default: () => statsRoute
});
module.exports = __toCommonJS(routes_exports);
var import_router = require("../classes/router");
var import_pckg = require("../pckg.json");
var fs = __toESM(require("fs/promises"));
var os = __toESM(require("os"));
const coreCount = os.cpus().length;
async function statsRoute(ctr2, ctg, ctx, routes) {
  const path = ctr2.url.path.replace((0, import_router.pathParser)(ctg.options.dashboard.path, false), "") || "/";
  switch (path) {
    case "/":
      const dashboard = (await fs.readFile(`${__dirname}/index.html`, "utf8")).replaceAll("/rjweb-dashboard", (0, import_router.pathParser)(ctg.options.dashboard.path)).replace("VERSION 1.1.1", `VERSION ${import_pckg.version}`);
      return ctr2.print(dashboard);
    case "/stats":
      const date = new Date();
      const startTime = date.getTime();
      const startUsage = process.cpuUsage();
      const cpuUsage = await new Promise((resolve) => setTimeout(() => {
        const currentUsage = process.cpuUsage(startUsage);
        const currentTime = new Date().getTime();
        const timeDelta = (currentTime - startTime) * 5 * coreCount;
        resolve((currentUsage.system + currentUsage.user) / timeDelta);
      }, 500));
      return ctr2.print({
        requests: [
          ctg.requests.total,
          {
            hour: ctx.previousHours[0],
            amount: ctg.requests[ctx.previousHours[0]]
          },
          {
            hour: ctx.previousHours[1],
            amount: ctg.requests[ctx.previousHours[1]]
          },
          {
            hour: ctx.previousHours[2],
            amount: ctg.requests[ctx.previousHours[2]]
          },
          {
            hour: ctx.previousHours[3],
            amount: ctg.requests[ctx.previousHours[3]]
          },
          {
            hour: ctx.previousHours[4],
            amount: ctg.requests[ctx.previousHours[4]]
          }
        ],
        data: {
          incoming: [
            ctg.data.incoming.total,
            {
              hour: ctx.previousHours[0],
              amount: ctg.data.incoming[ctx.previousHours[0]]
            },
            {
              hour: ctx.previousHours[1],
              amount: ctg.data.incoming[ctx.previousHours[1]]
            },
            {
              hour: ctx.previousHours[2],
              amount: ctg.data.incoming[ctx.previousHours[2]]
            },
            {
              hour: ctx.previousHours[3],
              amount: ctg.data.incoming[ctx.previousHours[3]]
            },
            {
              hour: ctx.previousHours[4],
              amount: ctg.data.incoming[ctx.previousHours[4]]
            }
          ],
          outgoing: [
            ctg.data.outgoing.total,
            {
              hour: ctx.previousHours[0],
              amount: ctg.data.outgoing[ctx.previousHours[0]]
            },
            {
              hour: ctx.previousHours[1],
              amount: ctg.data.outgoing[ctx.previousHours[1]]
            },
            {
              hour: ctx.previousHours[2],
              amount: ctg.data.outgoing[ctx.previousHours[2]]
            },
            {
              hour: ctx.previousHours[3],
              amount: ctg.data.outgoing[ctx.previousHours[3]]
            },
            {
              hour: ctx.previousHours[4],
              amount: ctg.data.outgoing[ctx.previousHours[4]]
            }
          ]
        },
        cpu: {
          time: `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`,
          usage: cpuUsage.toFixed(2)
        },
        memory: {
          time: `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`,
          usage: (process.memoryUsage().heapUsed / 1e3 / 1e3).toFixed(2)
        },
        routes,
        cached: ctg.cache.files.objectCount + ctg.cache.routes.objectCount
      });
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {});
