import handleCompressType, { CompressMapping } from "./handleCompressType";
function handleCompression(ctr2, ctx, options) {
  if (!ctx.compressed && !ctr2.rawRes.headersSent && String(ctr2.headers.get("accept-encoding")).includes(CompressMapping[options.compression])) {
    ctr2.rawRes.setHeader("Content-Encoding", CompressMapping[options.compression]);
    ctr2.rawRes.setHeader("Vary", "Accept-Encoding");
    const compression = handleCompressType(options.compression);
    compression.pipe(ctr2.rawRes);
    compression.end(ctx.content, "binary");
  } else {
    ctr2.rawRes.end(ctx.content, "binary");
  }
}
export {
  handleCompression as default
};
