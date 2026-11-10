import { Duplex } from "stream"
import type Logger from "@/classes/Logger"
import { isArrayBuffer, isMap, isPromise, isSet } from "util/types"
import type { JSONParsed, JSONValue } from "@/types/global"
import toArrayBuffer from "@/functions/toArrayBuffer"

const failMessage = toArrayBuffer('Failed to parse provided Object')
const emptyBuffer = new ArrayBuffer(0)

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
				const parsed = await parseContentSync(chunk, prettify, logger)

				this.push(parsed.content, 'binary')
			}, read() {}
		})
	}
}

export type ParseContentReturns = {
	headers: Record<string, string>
	content: ArrayBuffer
}

function emptyHeaders(): Record<string, string> {
	return {}
}

function jsonHeaders(): Record<string, string> {
	return { 'content-type': 'application/json' }
}

/**
 * Parse almost anything into a Buffer that resolves to a string, synchronously when possible
 * 
 * Only returns a Promise when the content itself is (or produces) a Promise
 * @since 9.9.1
*/ export function parseContentSync(content: Content, prettify: boolean = false, logger?: Logger): ParseContentReturns | Promise<ParseContentReturns> {
	if (typeof content === 'string') return { headers: emptyHeaders(), content: toArrayBuffer(content) }
	if (isPromise(content)) return content.then((awaited) => parseContentSync(awaited as any, prettify, logger))

	if (isArrayBuffer(content)) return { headers: emptyHeaders(), content }
	if (Buffer.isBuffer(content)) return { headers: emptyHeaders(), content: toArrayBuffer(content) }

	switch (typeof content) {
		case "string":
			return { headers: emptyHeaders(), content: toArrayBuffer(content) }

		case "object": {
			if (content === null) return { headers: jsonHeaders(), content: toArrayBuffer('null') }

			if (isMap(content)) content = Object.fromEntries(content.entries())
			else if (isSet(content)) content = Array.from(content)

			try {
				return {
					headers: jsonHeaders(),
					content: toArrayBuffer(prettify ? JSON.stringify(content, null, 2) : JSON.stringify(content))
				}
			} catch (err) {
				logger?.error('Failed to parse Object content:', err)
				return { headers: emptyHeaders(), content: failMessage }
			}
		}

		case "symbol":
			return { headers: emptyHeaders(), content: toArrayBuffer(content.toString()) }

		case "bigint":
		case "number":
		case "boolean":
			return { headers: emptyHeaders(), content: toArrayBuffer(String(content)) }

		case "function": {
			const result = content()
			if (isPromise(result)) return result.then((awaited) => parseContentSync(awaited as any, prettify, logger)).then((parsed) => ({ headers: emptyHeaders(), content: parsed.content }))

			const parsed = parseContentSync(result, prettify, logger)
			if (isPromise(parsed)) return parsed.then((parsed) => ({ headers: emptyHeaders(), content: parsed.content }))

			return { headers: emptyHeaders(), content: parsed.content }
		}

		case "undefined":
			return { headers: emptyHeaders(), content: emptyBuffer }
	}

	logger?.error('Unknown Content Parsing Error occured (nB):', content)
	return { headers: emptyHeaders(), content: toArrayBuffer('Unknown Parsing Error') }
}

/**
 * Parse almost anything into a Buffer that resolves to a string
 * @since 5.0.0
*/ export default async function parseContent(content: Content, prettify: boolean = false, logger?: Logger): Promise<ParseContentReturns> {
	return parseContentSync(content, prettify, logger)
}
