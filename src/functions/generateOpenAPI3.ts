import { GlobalContext } from "../types/context"
import { OpenAPIObject, ParameterObject, PathsObject } from "../types/openAPI3"
import { Version } from ".."
import { isRegExp } from "util/types"
import Route from "../types/http"

const transformRoutePath = (route: Route): {
	path: string
	parameters: ParameterObject[]
} => {
	let parts: string[] = [], parameters: ParameterObject[] = []

	if (isRegExp(route.path)) return {
		path: (route as any).pathStartWith.slice(1) + `/{${route.path}}`,
		parameters
	}

	for (const part of (route as any).pathArray as string[]) {
		if (/^<.*>$/.test(part)) {
			const replaced = part.replace('<', '{').replace('>', '}')

			parts.push(replaced)
			parameters.push({
				name: replaced.replace(/\{|\}/g, ''),
				in: 'path'
			})
		} else parts.push(part)
	}

	return {
		path: parts.join('/'),
		parameters
	}
}

export default function generateOpenAPI3(ctg: GlobalContext, server?: string): OpenAPIObject {
	const paths: PathsObject = {}

	for (const route of ctg.routes.normal) {
		const { path, parameters } = transformRoutePath(route)

		if (!paths[path]) paths[path] = {}

		paths[path][route.method.toLowerCase() as 'delete'] = {
			responses: {},
			parameters
		}
	}

	return {
		openapi: '3.1.0',

		info: {
			title: 'rjweb-server openapi routes',
			description: 'auto generated openapi 3.1 routes',
			version: Version
		},

		servers: [
			server ? {
				url: server,
				description: 'User Provided Server'
			} : {
				url: `http://localhost:${ctg.options.port}`,
				description: 'localhost + port'
			}
		],

		paths
	}
}