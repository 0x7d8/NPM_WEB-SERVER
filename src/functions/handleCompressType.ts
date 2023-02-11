import { PassThrough } from "stream"
import * as zlib from "zlib"

export type CompressTypes = 'none' | 'gzip' | 'brotli' | 'deflate'

export const CompressMapping = {
  gzip: 'gzip',
  brotli: 'br',
  deflate: 'deflate',
  none: 'none',
} as Record<CompressTypes, string>

class createNone extends PassThrough {
  close: () => {}
}

export default function handleCompressType(type: CompressTypes) {
  switch (type) {
    case "gzip":
      return zlib.createGzip()

    case "brotli":
      return zlib.createBrotliCompress()

    case "deflate":
      return zlib.createDeflate()

    default:
      return new createNone()
  }
}