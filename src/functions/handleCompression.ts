import { RequestContext } from "../interfaces/context"
import handleCompressType, { CompressMapping } from "./handleCompressType"
import { Options } from "../classes/serverOptions"
import ctr from "../interfaces/ctr"

export default function handleCompression(ctr: ctr, ctx: RequestContext, options: Options) {
  if (!ctx.compressed && !ctr.rawRes.headersSent && String(ctr.headers.get('accept-encoding')).includes(CompressMapping[options.compression])) {
    ctr.rawRes.setHeader('Content-Encoding', CompressMapping[options.compression])
    ctr.rawRes.setHeader('Vary', 'Accept-Encoding')

    const compression = handleCompressType(options.compression)
    compression.pipe(ctr.rawRes)
    compression.end(ctx.content, 'binary')
  } else {
    ctr.rawRes.end(ctx.content, 'binary')
  }
}