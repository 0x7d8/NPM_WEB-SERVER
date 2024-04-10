import { Duplex } from "stream"
import Logger from "@/classes/Logger"
import { isArrayBuffer, isMap, isPromise, isSet } from "util/types"
import { JSONParsed, JSONValue } from "@/types/global"
import toArrayBuffer from "@/functions/toArrayBuffer"

const failMessage = toArrayBuffer('Failed to parse provided Object')

export type Content =
	| string
	| Buffer
	| ArrayBuffer
	| Map<string, JSONValue>
	| Set<JSONValue>
	| number
	| boolean
	| undefined
	| symbol
	| { toString(): string }
	| Function
	| JSONValue[]
	| JSONParsed

export type ParseContentReturns = Awaited<ReturnType<typeof parseContent>>

/**
 * Parse almost anything into a Buffer that resolves to a string in a streamed manner
 * @example
 * ```
 * const parseStream = new ParseStream(...)
 * ```
 * @since 7.9.0
*/ export class ParseStream extends Duplex {
	/**
	 * Create a new Stream for Parsing Content on the fly
	 * @since 7.9.0
	*/ constructor(options: {
		/**
		 * Whether to prettify output (currently just JSONs)
		 * @default false
		 * @since 7.9.0
		*/ prettify?: boolean
	} = {}, logger?: Logger) {
		const prettify = options?.prettify ?? false

		super({
			writableObjectMode: true,
			async write(chunk) {
				const parsed = await parseContent(chunk, prettify, logger)

				this.push(parsed.content, 'binary')
			}, read() {}
		})
	}
}

/**
 * Parse almost anything into a Buffer that resolves to a string
 * @since 5.0.0
*/ export default async function parseContent(content: Content, prettify: boolean = false, logger?: Logger): Promise<{
	headers: Record<string, string>
	content: ArrayBuffer
}> {
	if (isPromise(content)) return parseContent(await content as any, prettify, logger)

	if (isArrayBuffer(content)) return { headers: {}, content }
	if (Buffer.isBuffer(content)) return { headers: {}, content: toArrayBuffer(content) }

	if (isMap(content)) content = Object.fromEntries(content.entries())
	if (isSet(content)) content = Array.from(content)

	const returnObject: ParseContentReturns = { headers: {}, content: new ArrayBuffer(0) }

	switch (typeof content) {
		case "object":
			try {
				if (prettify) returnObject.content = toArrayBuffer(JSON.stringify(content, null, 2))
				else returnObject.content = toArrayBuffer(JSON.stringify(content))

				returnObject.headers['content-type'] = 'application/json'
			} catch (err) {
				logger?.error('Failed to parse Object content:', err)
				returnObject.content = failMessage
			}

			break

		case "string":
			returnObject.content = toArrayBuffer(content)

			if ((content as any).json) {
				returnObject.headers['content-type'] = 'application/json'
			}

			break

		case "symbol":
			returnObject.content = toArrayBuffer(content.toString())
			break

		case "bigint":
		case "number":
		case "boolean":
			returnObject.content = toArrayBuffer(String(content))
			break

		case "function":
			const result = await Promise.resolve(content())
			returnObject.content = (await parseContent(result, prettify, logger)).content

			break

		case "undefined":
			returnObject.content = new ArrayBuffer(0)
			break
	}

	if (!isArrayBuffer(returnObject.content)) {
		logger?.error('Unknown Content Parsing Error occured (nB):', returnObject.content)
		returnObject.content = toArrayBuffer('Unknown Parsing Error')
	}

	return returnObject
}