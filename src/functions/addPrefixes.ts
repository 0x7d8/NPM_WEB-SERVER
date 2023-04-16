import { pathParser } from "../classes/URLObject"

export default function addPrefixes<T extends Record<string, any>>(objects: T[], key: string, splitKey: string | null, prefix: string): T[] {
	if (objects.length === 0) return []
	else if (splitKey) return objects.map((obj, index) => ({
		...obj,
		[key]: pathParser([ prefix, objects[index][key] ]),
		[splitKey]: pathParser([ prefix, objects[index][key] ]).split('/')
	}))
	else return objects.map((obj, index) => ({
		...obj,
		[key]: pathParser([ prefix, objects[index][key] ])
	}))
}