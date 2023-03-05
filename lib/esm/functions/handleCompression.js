import handleCompressType, { CompressMapping } from "./handleCompressType";
function handleCompression(ctr2, ctx, ctg) {
  if (!ctx.compressed && !ctr2.rawRes.headersSent && String(ctr2.headers.get("accept-encoding")).includes(CompressMapping[ctg.options.compression])) {
    ctr2.rawRes.setHeader("Content-Encoding", CompressMapping[ctg.options.compression]);
    ctr2.rawRes.setHeader("Vary", "Accept-Encoding");
    const compression = handleCompressType(ctg.options.compression);
    compression.on("data", (data) => {
      ctg.data.outgoing.total += data.byteLength;
      ctg.data.outgoing[ctx.previousHours[4]] += data.byteLength;
    });
    compression.pipe(ctr2.rawRes);
    compression.end(ctx.content, "binary");
  } else {
    ctg.data.outgoing.total += ctx.content.byteLength;
    ctg.data.outgoing[ctx.previousHours[4]] += ctx.content.byteLength;
    ctr2.rawRes.end(ctx.content, "binary");
  }
}
export {
  handleCompression as default
};
