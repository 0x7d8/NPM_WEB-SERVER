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
var parseContent_exports = {};
__export(parseContent_exports, {
  default: () => parseContent
});
module.exports = __toCommonJS(parseContent_exports);
var import_types = require("util/types");
async function parseContent(content) {
  let returnObject = { headers: {}, content: Buffer.alloc(0) };
  if (Buffer.isBuffer(content))
    return { headers: {}, content };
  if ((0, import_types.isMap)(content))
    content = Object.fromEntries(content);
  switch (typeof content) {
    case "object":
      returnObject.headers["Content-Type"] = "application/json";
      returnObject.content = Buffer.from(JSON.stringify(content));
      break;
    case "string":
      returnObject.content = Buffer.from(content);
      break;
    case "symbol":
      returnObject.content = Buffer.from(content.toString());
      break;
    case "bigint":
    case "number":
    case "boolean":
      returnObject.content = Buffer.from(String(content));
      break;
    case "function":
      const result = await Promise.resolve(content());
      returnObject.content = (await parseContent(result)).content;
      break;
    case "undefined":
      returnObject.content = Buffer.alloc(0);
      break;
  }
  return returnObject;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {});
