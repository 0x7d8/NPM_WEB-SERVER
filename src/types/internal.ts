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
import RouteRateLimit from "../classes/router/rateLimit"

export type EndFn = (...args: any[]) => void
export type RealAny = PromiseLike<any> | Promise<any> | any
export type AnyClass = new (...args: any[]) => any

export type UnionToIntersection<U> =
  (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never

type ExtractParametersArray<S extends string> = 
  S extends `${string}{${infer W}}${infer RE}`
    ? [W, ...ExtractParametersArray<RE>]
    : []
	
export type ExtractParameters<S extends string> = ExtractParametersArray<S>[number] extends never ? string : ExtractParametersArray<S>[number]

export type MergeObjects<T extends object[]> = {
  [K in keyof UnionToIntersection<T[number]>]:
    UnionToIntersection<T[number]>[K]
}

export type ExcludeFrom<T extends object, U extends (keyof T)[]> = {
	[K in Exclude<keyof T, U[number]>]: T[K]
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
	validations: RoutedValidation[]
	httpRatelimit: RouteRateLimit['data']
	wsRatelimit: RouteRateLimit['data']
	headers: Record<string, Buffer>
	fileBasedRouting: boolean
}

type BaseCookie = {
	/**
	 * The Domain this Cookie will be assigned to.
	 * 
	 * If not provided will not be used in the Cookie Header.
	 * @default undefined
	 * @since 8.3.0
	*/ domain?: string
	/**
	 * Whether the Cookie should be HTTP only
	 * @default false
	 * @since 8.3.0
	*/ httpOnly?: boolean
	/**
	 * Whether the Cookie should be Secure (HTTPS only)
	 * @default false
	 * @since 8.3.0
	*/ secure?: boolean
	/**
	 * The Path under which to save the Cookie
	 * @default "/"
	 * @since 8.3.0
	*/ path?: string
	/**
	 * The SameSite Attribute of the Cookie
	 * @see https://datatracker.ietf.org/doc/html/draft-ietf-httpbis-cookie-same-site-00#section-4.1.1
	 * @default false
	 * @since 8.3.0
	*/ sameSite?: false | 'strict' | 'lax' | 'none'

	/**
	 * The Value of the Cookie
	 * @since 8.3.0
	*/ value: Content
}

type ExpiresCookie = {
	/**
	 * The Date the Cookie will expire
	 * 
	 * If not provided will create a "Session Cookie".
	 * @default undefined
	 * @since 8.3.0
	*/ expires?: Date
} & BaseCookie

type MaxAgeCookie = {
	/**
	 * The Age after Cookie will expire
	 * 
	 * If not provided will create a "Session Cookie".
	 * @default undefined
	 * @since 8.3.1
	*/ maxAge?: number
} & BaseCookie

export type CookieSettings = ExpiresCookie | MaxAgeCookie

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

export type AnyRouter = RouteWS<any, any, any, any> | RouteHTTP<any, any, any, any> | RoutePath<any, any> | RouteIndex<any> | RouteContentTypes | RouteDefaultHeaders

export type MiddlewareInitted = ReturnType<MiddlewareLoader<any, any, any, any, any, any>['config']>

export type Routed = (ctr: HTTPRequest) => RealAny
export type RoutedValidation<Context extends Record<any, any> = {}, Body = unknown, Middlewares extends MiddlewareInitted[] = [], Path extends string = '/'> = (ctr: MergeObjects<[ HTTPRequest<Context, Body, Path>, InstanceType<Middlewares[number]['data']['classModifications']['http']> ]>, end: EndFn) => RealAny