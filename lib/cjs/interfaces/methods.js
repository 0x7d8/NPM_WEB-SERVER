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
var methods_exports = {};
__export(methods_exports, {
  default: () => methods_default
});
module.exports = __toCommonJS(methods_exports);
var HTTPtypes = /* @__PURE__ */ ((HTTPtypes2) => {
  HTTPtypes2["options"] = "OPTIONS";
  HTTPtypes2["delete"] = "DELETE";
  HTTPtypes2["patch"] = "PATCH";
  HTTPtypes2["post"] = "POST";
  HTTPtypes2["head"] = "HEAD";
  HTTPtypes2["put"] = "PUT";
  HTTPtypes2["get"] = "GET";
  HTTPtypes2["static"] = "STATIC";
  HTTPtypes2["staticdir"] = "STATICDIR";
  return HTTPtypes2;
})(HTTPtypes || {});
var methods_default = HTTPtypes;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {});
