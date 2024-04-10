const decoder = new TextDecoder()

/**
 * Convert Buffers to ArrayBuffers to strings
 * @since 9.0.0
*/ export default function toString(input: Buffer | ArrayBufferLike): string {
	if (input instanceof Buffer) return input.toString('utf8')
	else return decoder.decode(input)
}