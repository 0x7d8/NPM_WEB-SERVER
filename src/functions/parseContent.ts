import { isMap, isSet } from "util/types"

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
	| Content[]

export interface Returns {
	headers: Record<string, Buffer>
	content: Buffer
}

export default async function parseContent(content: Content): Promise<Returns> {
	let returnObject: Returns = { headers: {}, content: Buffer.alloc(0) }
	if (Buffer.isBuffer(content)) return { headers: {}, content }
	if (isMap(content)) content = Object.fromEntries(content)
	if (isSet(content)) content = Object.fromEntries(content.entries())

	switch (typeof content) {
		case "object":
			returnObject.headers['Content-Type'] = Buffer.from('application/json')

			try {
				returnObject.content = Buffer.from(JSON.stringify(content))
			} catch {
				returnObject.content = Buffer.from('Failed to parse JSON Data')
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
			returnObject.content = Buffer.alloc(0)
			break
	}

	return returnObject
}