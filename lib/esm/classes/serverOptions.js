class serverOptions {
  /** Server Options Helper */
  constructor(options) {
    this.data = this.mergeOptions({
      rateLimits: {
        enabled: false,
        message: "Rate Limited",
        list: [],
        functions: /* @__PURE__ */ new Map()
      },
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
export {
  serverOptions as default
};
