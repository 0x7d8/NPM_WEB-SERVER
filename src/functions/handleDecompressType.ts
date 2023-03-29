import { PassThrough } from "stream"

import zlib from "zlib"

export type DecompressTypes = 'none' | 'gzip' | 'brotli' | 'inflate'
export const DecompressMapping = {
	gzip: 'gzip',
	br: 'brotli',
	inflate: 'inflate',
	none: 'none'
} as Record<string, DecompressTypes>

export default function handleDecompressType(type: DecompressTypes) {
	switch (type) {
		case "gzip":
			return zlib.createGunzip()

		case "brotli":
			return zlib.createBrotliDecompress()

		case "inflate":
			return zlib.createInflate()

		default:
			return new PassThrough()
	}
}