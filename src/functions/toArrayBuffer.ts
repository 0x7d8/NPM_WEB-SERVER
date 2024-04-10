const encoder = new TextEncoder()

/**
 * Convert strings or Buffers to ArrayBuffers
 * @since 9.0.0
*/ export default function toArrayBuffer(input: string | Buffer): ArrayBufferLike {
	if (typeof input === 'string') return encoder.encode(input).buffer
	else return input.buffer.slice(input.byteOffset, input.byteOffset + input.byteLength)
}