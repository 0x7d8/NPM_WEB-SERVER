import { pathParser } from "../classes/router";
import { getAllFiles } from "../misc/getAllFiles";
import { version } from "../pckg.json";
import * as fs from "fs/promises";
import * as os from "os";
const coreCount = os.cpus().length;
async function statsRoute(ctr, ctg, ctx) {
  const path = ctr.url.path.replace(pathParser(ctg.options.dashboard.path, false), "") || "/";
  switch (path) {
    case "/":
      const dashboard = (await fs.readFile(`${__dirname}/index.html`, "utf8")).replaceAll("/rjweb-dashboard", pathParser(ctg.options.dashboard.path)).replace("VERSION 1.1.1", `VERSION ${version}`);
      return ctr.print(dashboard);
    case "/stats":
      const date = /* @__PURE__ */ new Date();
      const startTime = date.getTime();
      const startUsage = process.cpuUsage();
      const staticFiles = await new Promise(async (resolve) => {
        let staticFiles2 = 0;
        for (let staticNumber = 0; staticNumber <= ctg.routes.static.length - 1; staticNumber++) {
          staticFiles2 += (await getAllFiles(ctg.routes.static[staticNumber].location)).length;
        }
        resolve(staticFiles2);
      });
      const cpuUsage = await new Promise((resolve) => setTimeout(() => {
        const currentUsage = process.cpuUsage(startUsage);
        const currentTime = (/* @__PURE__ */ new Date()).getTime();
        const timeDelta = (currentTime - startTime) * 5 * coreCount;
        resolve((currentUsage.system + currentUsage.user) / timeDelta);
      }, 500));
      return ctr.print({
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
        static_files: staticFiles,
        routes: ctg.routes.normal.length,
        cached: ctg.cache.files.objectCount + ctg.cache.routes.objectCount
      });
  }
}
export {
  statsRoute as default
};
