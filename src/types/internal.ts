import { Content } from "../functions/parseContent"
import { HTTPRequestContext, WSRequestContext } from "./external"

export type DeepRequired<Type> = Type extends Content
		? Type extends Map<any, any>
			? Required<Type>
		: Type extends Set<any>
			? Required<Type> 
		: Type extends Buffer
			? Required<Type>
		: Type extends Function
			? Required<Type>
		: Type extends Array<any>
			? Required<Type>
		: Type extends {}
			? { [Key in keyof Type]-?: DeepRequired<Type[Key]> }
		: Required<Type>
	: Type extends {}
  ? { [Key in keyof Type]-?: DeepRequired<Type[Key]> }
  : Required<Type>

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