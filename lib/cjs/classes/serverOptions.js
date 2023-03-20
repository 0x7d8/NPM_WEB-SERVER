var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var serverOptions_exports = {};
__export(serverOptions_exports, {
  default: () => ServerOptions
});
module.exports = __toCommonJS(serverOptions_exports);
class ServerOptions {
  /** Server Options Helper */
  constructor(options) {
    this.data = this.mergeOptions({
      body: {
        enabled: true,
        parse: true,
        maxSize: 5,
        message: "Payload too large"
      },
      https: {
        enabled: false,
        keyFile: "/ssl/key/path",
        certFile: "/ssl/cert/path"
      },
      dashboard: {
        enabled: false,
        path: "/rjweb-dashboard"
      },
      headers: {},
      contentTypes: {},
      bind: "0.0.0.0",
      proxy: false,
      compression: "none",
      cors: false,
      port: 2023,
      poweredBy: true
    }, options);
  }
  mergeOptions(...objects) {
    const isObject = (obj) => obj && typeof obj === "object";
    return objects.reduce((prev, obj) => {
      Object.keys(obj).forEach((key) => {
        const pVal = prev[key];
        const oVal = obj[key];
        if (key !== "functions" && key !== "routes") {
          if (Array.isArray(pVal) && Array.isArray(oVal))
            prev[key] = pVal.concat(...oVal);
          else if (isObject(pVal) && isObject(oVal))
            prev[key] = this.mergeOptions(pVal, oVal);
          else
            prev[key] = oVal;
        } else
          prev[key] = oVal;
      });
      return prev;
    }, {});
  }
  /** Get the Resulting Options */
  getOptions() {
    return this.data;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {});
