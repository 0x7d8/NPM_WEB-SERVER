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
var handleCompression_exports = {};
__export(handleCompression_exports, {
  default: () => handleCompression
});
module.exports = __toCommonJS(handleCompression_exports);
var import_handleCompressType = __toESM(require("./handleCompressType"));
function handleCompression(ctr, ctx, ctg) {
  if (!ctx.compressed && !ctr.rawRes.headersSent && String(ctr.headers.get("accept-encoding", "")).includes(import_handleCompressType.CompressMapping[ctg.options.compression])) {
    ctr.rawRes.setHeader("Content-Encoding", import_handleCompressType.CompressMapping[ctg.options.compression]);
    ctr.rawRes.setHeader("Vary", "Accept-Encoding");
    const compression = (0, import_handleCompressType.default)(ctg.options.compression);
    compression.on("data", (data) => {
      ctg.data.outgoing.total += data.byteLength;
      ctg.data.outgoing[ctx.previousHours[4]] += data.byteLength;
    });
    compression.pipe(ctr.rawRes);
    compression.end(ctx.content, "binary");
  } else {
    ctg.data.outgoing.total += ctx.content.byteLength;
    ctg.data.outgoing[ctx.previousHours[4]] += ctx.content.byteLength;
    ctr.rawRes.end(ctx.content, "binary");
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {});
