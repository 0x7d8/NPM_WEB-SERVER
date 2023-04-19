import { isMap, isSet } from "util/types"
import typia from "typia"

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
	| (
			| Record<any, any>
			| string
			| number
			| boolean
		)[]

export interface Returns {
	headers: Record<string, Buffer>
	content: Buffer
}

export default async function parseContent(content: Content, prettify: boolean = false): Promise<Returns> {
	const returnObject: Returns = { headers: {}, content: Buffer.allocUnsafe(0) }

	if (Buffer.isBuffer(content)) return { headers: {}, content }
	if (isMap(content)) content = Object.fromEntries(content.entries())
	if (isSet(content)) content = Object.fromEntries(content.entries())

	switch (typeof content) {
		case "object":
			try {
				if (prettify) returnObject.content = Buffer.from(JSON.stringify(content, null, 2))
				else returnObject.content = Buffer.from(typia.stringify(content))

				returnObject.headers['content-type'] = Buffer.from('application/json')
			} catch {
				returnObject.content = Buffer.from('Failed to parse provided Object')
			}

			break

		case "string":
			returnObject.content = Buffer.from(content)
			break

		case "symbol":
			returnObject.content = Buffer.from(content.toString())
			break

		case "bigint":
		case "number":
		case "boolean":
			returnObject.content = Buffer.from(String(content))
			break

		case "function":
			const result = await Promise.resolve(content())
			returnObject.content = (await parseContent(result)).content

			break

		case "undefined":
			returnObject.content = Buffer.allocUnsafe(0)
			break
	}

	return returnObject
}