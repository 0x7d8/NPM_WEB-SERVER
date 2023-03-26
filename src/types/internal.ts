import { HTTPRequestContext, WSRequestContext } from "./external"

export type Task = {
	type: 'context' | 'execution'
	function: Function
}

export type LoadPath = {
	path: string
	prefix: string
	type: 'cjs' | 'esm'
	validations: Routed[]
}

export type HTTPMethods =
	| 'OPTIONS'
	| 'DELETE'
	| 'PATCH'
	| 'POST'
	| 'HEAD'
	| 'PUT'
	| 'GET'

export type ExternalRouter = {
	method: string
	object: unknown
}

export type Routed = (ctr: HTTPRequestContext) => Promise<any> | any
export type RoutedWS<Type extends WSRequestContext['type']> = (ctr: WSRequestContext) => Promise<any> | any