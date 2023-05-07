import { isRegExp } from "util/types"
import RouteFile from "../classes/router/file"
import { LoadPath } from "../types/internal"
import parsePath from "./parsePath"
import Logger from "../classes/logger"

export function addPathToProperty<Object extends Record<any, any>>(object: Object, property: keyof Object, arrayProperty: keyof Object = null, path: string): Object {
	const newPath = parsePath([
		path,
		object[property]
	])

	object[property] = newPath as any
	if (arrayProperty) object[arrayProperty] = newPath.split('/') as any

	return object
}

export async function addPathsToLoadedRouter(loadPath: LoadPath, route: RouteFile<any, any>, path: string, logger: Logger) {
	const data = await route.getData('/')

	for (let index = 0; index < data.routes.length; index++) {
		const route = data.routes[index]

		logger.debug('Route File (ht) before Path Transformation:', route)

		if (isRegExp(route.path)) addPathToProperty(route, 'pathStartWith' as any, undefined, parsePath([ loadPath.prefix, path ]))
		else addPathToProperty(route, 'path', 'pathArray' as any, parsePath([ loadPath.prefix, path ]))

		logger.debug('Route File (ht) after Path Transformation:', route)
	}

	for (let index = 0; index < data.webSockets.length; index++) {
		const route = data.webSockets[index]

		logger.debug('Route File (ws) before Path Transformation:', route)

		if (isRegExp(route.path)) addPathToProperty(route, 'pathStartWith' as any, undefined, parsePath([ loadPath.prefix, path ]))
		else addPathToProperty(route, 'path', 'pathArray' as any, parsePath([ loadPath.prefix, path ]))

		logger.debug('Route File (ws) after Path Transformation:', route)
	}

	return {
		routes: data.routes,
		webSockets: data.webSockets
	}
}