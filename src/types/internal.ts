import { Content } from "../functions/parseContent"
import { MiddlewareLoader } from "../classes/middlewareBuilder"
import HTTPRequest from "../classes/web/HttpRequest"
import Methods from "../misc/methodsEnum"

import RouteIndex from "../classes/router"
import RoutePath from "../classes/router/path"
import RouteContentTypes from "../classes/router/contentTypes"
import RouteDefaultHeaders from "../classes/router/defaultHeaders"
import RouteWS from "../classes/router/ws"
import RouteHTTP from "../classes/router/http"

export type EndFn = (...args: any[]) => void
export type RealAny = PromiseLike<any> | Promise<any> | any
export type AnyClass = new (...args: any[]) => any

export type UnionToIntersection<U> =
  (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never

type ExtractParametersRecord<Path extends string> = Path extends `${infer Segment}/${infer Rest}`
  ? Segment extends `<${infer Param}>` ? Record<Param, string> & ExtractParametersRecord<Rest> : ExtractParametersRecord<Rest>
  : Path extends `<${infer Param}>` ? Record<Param, string> : {}

export type ExtractParameters<Path extends string> = keyof ExtractParametersRecord<Path> extends never ? string : keyof ExtractParametersRecord<Path>

export type MergeObjects<T extends object[]> = {
  [K in keyof UnionToIntersection<T[number]>]:
    UnionToIntersection<T[number]>[K]
}

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

export type DeepPartial<T> = T extends object ? {
	[P in keyof T]?: DeepPartial<T[P]>
} : T

export type LoadPath = {
	path: string
	prefix: string
	type: 'cjs' | 'esm'
	fileBasedRouting: boolean
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

export type AnyRouter = RouteWS<any, any, any> | RouteHTTP<any, any, any> | RoutePath<any> | RouteIndex<any> | RouteContentTypes | RouteDefaultHeaders

export type MiddlewareInitted = ReturnType<MiddlewareLoader<any, any, any, any, any, any>['config']>

export type Routed = (ctr: HTTPRequest) => RealAny
export type RoutedValidation<Context extends Record<any, any> = {}, Body = unknown, Middlewares extends MiddlewareInitted[] = []> = (ctr: HTTPRequest<Context, Body> & MergeObjects<Middlewares>, end: EndFn) => RealAny