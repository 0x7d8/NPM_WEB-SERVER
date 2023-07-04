import { GlobalContext } from "../types/context"
import { OpenAPIObject, ParameterObject, PathsObject } from "../types/openAPI3"
import { Version } from ".."
import { isRegExp } from "util/types"
import Route from "../types/http"

const transformRoutePath = (route: Route): {
	path: string
	parameters: ParameterObject[]
} => {
	let base: string = '', parameters: ParameterObject[] = []

	for (const segment of route.path.data.segments) {
		base += `/${segment.raw}`

		for (const param of segment.params) {
			parameters.push({
				name: param,
				in: 'path'
			})
		}
	}

	for (const header in route.documentation['data'].headers) {
		parameters.push({
			...route.documentation['data'].headers[header],
			name: header,
			in: 'header'
		})
	}

	for (const query in route.documentation['data'].queries) {
		parameters.push({
			...route.documentation['data'].queries[query],
			name: query,
			in: 'query'
		})
	}

	if (isRegExp(route.path.path)) return {
		path: base.replace('//', '/').concat(`/{${route.path.path}}`),
		parameters
	}
	else return {
		path: base.replace('//', '/'),
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
			description: route.documentation['data'].description,
			deprecated: route.documentation['data'].deprecated,
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