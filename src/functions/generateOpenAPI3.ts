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

	if (isRegExp(route.path)) for (const part of (route as any).pathStartWith) {
		if (/^{.*}$/.test(part)) {
			parts.push(part)
			parameters.push({
				name: part.replace(/\{|\}/g, ''),
				in: 'path'
			})
		} else parts.push(part)
	}
	else for (const part of (route as any).pathArray as string[]) {
		if (/^{.*}$/.test(part)) {
			parts.push(part)
			parameters.push({
				name: part.replace(/\{|\}/g, ''),
				in: 'path'
			})
		} else parts.push(part)
	}

	if (isRegExp(route.path)) return {
		path: parts.join('/').concat(`\${${route.path}}`),
		parameters
	}
	else return {
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