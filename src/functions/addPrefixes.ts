import parsePath from "./parsePath"

export default function addPrefixes<T extends Record<string, any>>(objects: T[], key: keyof T, splitKey: keyof T | null, prefix: string): T[] {
	if (objects.length === 0) return []
	else if (splitKey) return objects.map((obj, index) => ({
		...obj,
		[key]: parsePath([ prefix, objects[index][key] ]),
		[splitKey]: parsePath([ prefix, objects[index][key] ]).split('/')
	}))
	else return objects.map((obj, index) => ({
		...obj,
		[key]: parsePath([ prefix, objects[index][key] ])
	}))
}