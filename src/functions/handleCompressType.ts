import { PassThrough } from "stream"

import zlib from "zlib"

export type CompressTypes = 'none' | 'gzip' | 'br' | 'deflate'

export default function handleCompressType(type: CompressTypes) {
	switch (type) {
		case "gzip":
			return zlib.createGzip()

		case "br":
			return zlib.createBrotliCompress()

		case "deflate":
			return zlib.createDeflate()

		default:
			return new PassThrough()
	}
}