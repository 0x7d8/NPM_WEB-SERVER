import { PassThrough } from "stream";
import zlib from "zlib";
const CompressMapping = {
  gzip: "gzip",
  brotli: "br",
  deflate: "deflate",
  none: "none"
};
class CreateNone extends PassThrough {
}
function handleCompressType(type) {
  switch (type) {
    case "gzip":
      return zlib.createGzip();
    case "brotli":
      return zlib.createBrotliCompress();
    case "deflate":
      return zlib.createDeflate();
    default:
      return new CreateNone();
  }
}
export {
  CompressMapping,
  handleCompressType as default
};
