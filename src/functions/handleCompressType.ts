import { Duplex, PassThrough } from "stream"
import size from "./size"

import zlib from "zlib"

class PassThrough64K extends Duplex {
	constructor() {
		super({
			read() {},
			write(chunk: ArrayBuffer) {
				let chunkCount = Math.ceil(chunk.byteLength / size(64).kb()), index = 0
		
				while (chunkCount) {
					this.push(chunk.slice(index, index + size(64).kb()))
					index += size(64).kb()
					chunkCount--
				}
			}
		})
	}
}

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