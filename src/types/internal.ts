import { Content } from "../functions/parseContent"
import { HTTPRequestContext, WSRequestContext } from "./external"
import Methods from "../misc/methodsEnum"

import RouteIndex from "../classes/router"
import RouteExternal from "../classes/router/external"
import RoutePath from "../classes/router/path"
import RouteContentTypes from "../classes/router/contentTypes"
import RouteDefaultHeaders from "../classes/router/defaultHeaders"
import RouteWS from "../classes/router/ws"
import RouteHTTP from "src/classes/router/http"

export type EndFn = (...args: any[]) => void
export type RealAny = PromiseLike<any> | Promise<any> | any

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
	validations: RoutedValidation[]
	headers: Record<string, Buffer>
}

export type HTTPMethods =
	| 'CONNECT'
	| 'TRACE'
	| 'OPTIONS'
	| 'DELETE'
	| 'PATCH'
	| 'POST'
	| 'HEAD'
	| 'PUT'
	| 'GET'
	| Methods

export type ExternalRouter = {
	object: AnyRouter
	addPrefix?: string
}

export type AnyRouter = RouteWS | RouteHTTP | RouteExternal | RoutePath | RouteIndex | RouteContentTypes | RouteDefaultHeaders

export type Routed = (ctr: HTTPRequestContext) => RealAny
export type RoutedValidation<Context extends Record<any, any> = {}, Body = unknown> = (ctr: HTTPRequestContext<Context, Body>, end: EndFn) => RealAny
export type RoutedWS = (ctr: WSRequestContext) => RealAny