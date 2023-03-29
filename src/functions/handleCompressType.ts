import { PassThrough } from "stream"

import zlib from "zlib"

export type CompressTypes = 'none' | 'gzip' | 'brotli' | 'deflate'
export const CompressMapping = {
	gzip: Buffer.from('gzip'),
	brotli: Buffer.from('br'),
	deflate: Buffer.from('deflate'),
	none: Buffer.from('none')
} as Record<CompressTypes, Buffer>

export default function handleCompressType(type: CompressTypes) {
	switch (type) {
		case "gzip":
			return zlib.createGzip()

		case "brotli":
			return zlib.createBrotliCompress()

		case "deflate":
			return zlib.createDeflate()

		default:
			return new PassThrough()
	}
}