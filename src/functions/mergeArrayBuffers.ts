/**
 * Merge Multiple Array Buffers
 * @since 9.0.0
*/ export default function mergeArrayBuffers(buffers: ArrayBufferLike[]): ArrayBufferLike {
	const array = new Uint8Array(buffers.reduce((prev, next) => prev + next.byteLength, 0))

	let length = 0
	for (const buffer of buffers) {
		array.set(new Uint8Array(buffer), length)
		length += buffer.byteLength
	}

	return array.buffer
}