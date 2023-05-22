import { Duplex } from "stream"
import Logger from "../classes/logger"
import { isMap, isPromise, isSet } from "util/types"

export type Content =
	| string
	| Buffer
	| Map<any, any>
	| Set<any>
	| number
	| boolean
	| undefined
	| Record<any, any>
	| symbol
	| Function
	| any[]
	| Promise<Content>

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
	/** The Headers associated with the parsed Content */ headers: Record<string, Buffer>
	/** The Parsed Content, 100% a Buffer */ content: Buffer
}> {
	const returnObject: ParseContentReturns = { headers: {}, content: Buffer.allocUnsafe(0) }

	if (isPromise(content)) {
		try {
			await new Promise<void>((resolve, reject) => {
				(content as Promise<Content>)
					.then(async(r) => {
						content = (await parseContent(r, prettify, logger)).content

						resolve()
					})
					.catch((e) => {
						reject(e)
					})
			})
		} catch (err) {
			logger?.error('Failed to resolve promisified content:', err)
		}
	}

	if (Buffer.isBuffer(content)) return { headers: {}, content }
	if (isMap(content)) content = Object.fromEntries(content.entries())
	if (isSet(content)) content = Object.fromEntries(content.entries())

	switch (typeof content) {
		case "object":
			try {
				if (prettify) returnObject.content = Buffer.from(JSON.stringify(content, null, 2))
				else returnObject.content = Buffer.from(JSON.stringify(content))

				returnObject.headers['content-type'] = Buffer.from('application/json')
			} catch (err) {
				logger?.error('Failed to parse Object content:', err)
				returnObject.content = Buffer.from('Failed to parse provided Object')
			}

			break

		case "string":
			returnObject.content = Buffer.from(content, 'utf8')
			break

		case "symbol":
			returnObject.content = Buffer.from(content.toString(), 'utf8')
			break

		case "bigint":
		case "number":
		case "boolean":
			returnObject.content = Buffer.from(String(content), 'utf8')
			break

		case "function":
			const result = await Promise.resolve(content())
			returnObject.content = (await parseContent(result, prettify, logger)).content

			break

		case "undefined":
			returnObject.content = Buffer.allocUnsafe(0)
			break
	}

	if (!Buffer.isBuffer(returnObject.content)) {
		logger?.error('Unknown Content Parsing Error occured (nB):', returnObject.content)
		returnObject.content = Buffer.from('Unknown Parsing Error', 'utf8')
	}

	return returnObject
}