import { pathParser } from "../classes/router";
import { version } from "../pckg.json";
import * as fs from "fs/promises";
import * as os from "os";
const coreCount = os.cpus().length;
async function statsRoute(ctr2, ctg, ctx, routes) {
  const path = ctr2.url.path.replace(pathParser(ctg.options.dashboard.path, false), "") || "/";
  switch (path) {
    case "/":
      const dashboard = (await fs.readFile(`${__dirname}/index.html`, "utf8")).replaceAll("/rjweb-dashboard", pathParser(ctg.options.dashboard.path)).replace("VERSION 1.1.1", `VERSION ${version}`);
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
        cached: ctg.cache.files.objectCount() + ctg.cache.routes.objectCount()
      });
  }
}
export {
  statsRoute as default
};