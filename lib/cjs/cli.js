#!/usr/bin/env node
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
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
var fs = __toESM(require("fs"));
var path = __toESM(require("path"));
var import_webServer = __toESM(require("./classes/webServer"));
var import_pckg = require("./pckg.json");
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
  console.log(`${colors.fg.yellow}[RJW] ${colors.reset}Version:`);
  console.log(`v${import_pckg.version}`);
} else if (!isHelp() && fs.existsSync(path.join(process.cwd(), args[0]))) {
  let remHTML = false, addTypes = true, notFoundPath = "", refreshInterval = -1;
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
      notFoundPath = String(value).replaceAll('"', "");
  }
  const server = new import_webServer.default(webserverOptions);
  server.prefix("/").static(path.join(process.cwd(), args[0]), { hideHTML: remHTML, addTypes });
  if (notFoundPath)
    server.event("notfound", async (ctr) => {
      return ctr.status(404).printFile(path.join(process.cwd(), notFoundPath));
    });
  server.event("request", async (ctr) => {
    console.log(`${colors.fg.yellow}[RJW] ${colors.fg.gray}[${ctr.url.method}] ${colors.fg.blue, colors.underscore}${ctr.url.href}${colors.reset} FROM ${ctr.client.ip}`);
  });
  server.start().then((res) => {
    console.log(`${colors.fg.yellow}[RJW] ${colors.reset}Server started on Port ${colors.fg.yellow}${res.port}${colors.reset}`);
  }).catch((err) => {
    var _a;
    console.log(`${colors.fg.yellow}[RJW] ${colors.reset}Error:`);
    console.log(`${colors.fg.yellow}[RJW] ${colors.reset}Maybe Port ${colors.fg.yellow}${(_a = webserverOptions.port) != null ? _a : 2023}${colors.reset} isnt available?`);
    console.error(`${colors.fg.red}[ERR]${colors.reset}`, err.error);
  });
} else if (!isHelp() && !fs.existsSync(path.join(process.cwd(), args[0]))) {
  console.log(`${colors.fg.yellow}[RJW] ${colors.reset}Error:`);
  console.log(`Folder ${colors.fg.red, colors.underscore}${path.join(process.cwd(), args[0])}${colors.reset} couldnt be found`);
} else {
  console.log(`${colors.fg.yellow}[RJW] ${colors.reset}Help:`);
  console.log(`rjw-srv ${colors.fg.blue}[folder] ${colors.fg.red}[arguments]`);
  console.log("");
  console.log(`[arguments] ${colors.reset}`);
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
