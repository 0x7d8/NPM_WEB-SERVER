#!/usr/bin/env node
import Server from "./classes/webServer";
import path from "path";
import fs from "fs";
import { version } from "./pckg.json";
const colors = {
  reset: "\x1B[0m",
  bright: "\x1B[1m",
  dim: "\x1B[2m",
  underscore: "\x1B[4m",
  blink: "\x1B[5m",
  reverse: "\x1B[7m",
  hidden: "\x1B[8m",
  fg: {
    black: "\x1B[30m",
    red: "\x1B[31m",
    green: "\x1B[32m",
    yellow: "\x1B[33m",
    blue: "\x1B[34m",
    magenta: "\x1B[35m",
    cyan: "\x1B[36m",
    white: "\x1B[37m",
    gray: "\x1B[90m"
  },
  bg: {
    black: "\x1B[40m",
    red: "\x1B[41m",
    green: "\x1B[42m",
    yellow: "\x1B[43m",
    blue: "\x1B[44m",
    magenta: "\x1B[45m",
    cyan: "\x1B[46m",
    white: "\x1B[47m",
    gray: "\x1B[100m",
    crimson: "\x1B[48m"
  }
};
const isHelp = () => !args[0] || args.includes("-h") || args.includes("--help");
const webserverOptions = { dashboard: {} };
const args = process.argv.slice(2);
if (args.includes("-v") || args.includes("--version")) {
  console.log(`${colors.fg.blue}[INF] ${colors.reset}Version:`);
  console.log(`${version}`);
} else if (!isHelp() && fs.existsSync(path.join(process.cwd(), args[0]))) {
  let remHTML = false, addTypes = true, notFoundPath = "";
  for (const option of args.slice(1)) {
    const [key, value] = option.slice(2).split("=");
    if (key === "port")
      webserverOptions.port = Number(value);
    if (key === "bind")
      webserverOptions.bind = value;
    if (key === "remHTML")
      remHTML = Boolean(value);
    if (key === "addTypes")
      remHTML = Boolean(value);
    if (key === "compression")
      webserverOptions.compression = value;
    if (key === "cors")
      webserverOptions.cors = Boolean(value);
    if (key === "proxy")
      webserverOptions.proxy = Boolean(value);
    if (key === "dashboard")
      webserverOptions.dashboard.enabled = Boolean(value);
    if (key === "404")
      notFoundPath = String(value).replace(/"|'+/g, "");
  }
  const server = new Server(webserverOptions);
  server.prefix("/").static(path.join(process.cwd(), args[0]), { hideHTML: remHTML, addTypes });
  if (notFoundPath)
    server.event("notfound", (ctr) => {
      return ctr.status(404).printFile(path.join(process.cwd(), notFoundPath));
    });
  server.event("request", (ctr) => {
    console.log(`${colors.fg.blue}[INF] ${colors.fg.cyan}[${ctr.url.method}] ${colors.fg.gray}${ctr.url.href}${colors.reset} FROM ${ctr.client.ip}`);
  });
  server.start().then((res) => {
    console.log(`${colors.fg.blue}[INF] ${colors.reset}Server started on Port ${colors.fg.yellow}${res.port}${colors.reset}`);
  }).catch((err) => {
    var _a;
    console.log(`${colors.fg.blue}[INF] ${colors.fg.red}An Error occurred!`);
    console.log(`${colors.fg.red}[ERR] ${colors.fg.gray}Maybe Port ${colors.fg.yellow}${(_a = webserverOptions.port) != null ? _a : 2023}${colors.fg.gray} isnt available?`);
    console.error(`${colors.fg.red}[ERR]${colors.fg.gray}`, err.error);
    process.exit(3);
  });
} else if (!isHelp() && !fs.existsSync(path.join(process.cwd(), args[0]))) {
  console.log(`${colors.fg.blue}[INF] ${colors.fg.red}An Error occurred!`);
  console.log(`${colors.fg.red}[ERR] ${colors.fg.gray}Folder ${colors.fg.red, colors.underscore}${path.join(process.cwd(), args[0])}${colors.reset} couldnt be found`);
} else {
  console.log(`${colors.fg.blue}[INF] ${colors.reset}Help`);
  console.log(`rjw-srv ${colors.fg.blue}[folder]`);
  console.log("");
  console.log(`${colors.fg.gray}[arguments] ${colors.reset}`);
  console.log(" --port=2023");
  console.log(" --compression=gzip");
  console.log(" --proxy=false");
  console.log(" --cors=false");
  console.log(" --bind=0.0.0.0");
  console.log(" --remHTML=false");
  console.log(" --addTypes=true");
  console.log(" --dashboard=false");
  console.log(' --404="static/404.html"');
}
