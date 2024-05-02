import { Method } from "@/types/global"
import ValueCollection from "@/classes/ValueCollection"
import parseURL from "@/functions/parseURL"
import { EndFn, RateLimitConfig, RealAny } from "@/types/internal"
import { isRegExp } from "util/types"
import { UsableValidator } from "@/classes/Validator"
import { OperationObject } from "openapi3-ts/oas31"

import HttpRequestContext from "@/classes/request/HttpRequestContext"
import WsOpenContext from "@/classes/request/WsOpenContext"
import WsMessageContext from "@/classes/request/WsMessageContext"
import WsCloseContext from "@/classes/request/WsCloseContext"

type Segment = {
	raw: string
	paramsRegExp: RegExp
	params: string[]
}

type URLData = {
	type: 'regexp'
	value: RegExp
	prefix: string
	segments: Segment[]
} | {
	type: 'normal'
	value: string
	segments: Segment[]
}

type RequestType = 'http' | 'static' | 'ws'

type Data<Type extends RequestType> = Type extends 'http' ? {
	onRawBody?(ctr: HttpRequestContext, end: EndFn, chunk: ArrayBuffer, isLast: boolean): RealAny
	onRequest?(ctr: HttpRequestContext): RealAny
} : Type extends 'static' ? {
	folder: string
	stripHtmlEnding: boolean
} : {
	onUpgrade?(ctr: HttpRequestContext, end: EndFn): RealAny

	onOpen?(ctr: WsOpenContext): RealAny
	onMessage?(ctr: WsMessageContext): RealAny
	onClose?(ctr: WsCloseContext): RealAny
}

export default class Route<Type extends RequestType> {
	public urlData: URLData

	/**
	 * Create a new Route
	 * @since 9.0.0
	*/ constructor(public type: Type, private urlMethod: Method, path: string | RegExp, data: Data<Type>) {
		this.data = data

		if (isRegExp(path)) {
			this.urlData = {
				type: 'regexp',
				value: path,
				prefix: '/',
				segments: [{
					raw: '',
					paramsRegExp: new RegExp(''),
					params: []
				}, {
					raw: '',
					paramsRegExp: new RegExp(''),
					params: []
				}]
			}
		} else if (typeof path === 'string') {
			const segments = parseURL(path).path.split('/')

			this.urlData = {
				type: 'normal',
				value: segments.join('/'),
				segments: []
			}

			for (const segment of segments) {
				this.urlData.segments.push({
					raw: segment,
					paramsRegExp: new RegExp(segment.replace(/{([^}]+)}/g, '(.*\\S)')),
					params: (segment.match(/{([^}]+)}/g) ?? []).map((m) => m.slice(1, -1))
				})
			}
		} else {
			throw new Error(`Invalid Path (${typeof path})`)
		}
	}

	/**
	 * The Data of this Route
	 * @since 9.0.0
	*/ public data: Data<Type>
	/**
	 * The Validators of this Route
	 * @since 9.0.0
	*/ public validators: UsableValidator[] = []
	/**
	 * The Ratelimit of this Route
	 * @since 9.0.0
	*/ public ratelimit: Type extends 'static' ? null : RateLimitConfig | null = null
	/**
	 * The OpenAPI Schema of this Route
	 * @since 9.0.0
	*/ public openApi: OperationObject = {}

	/**
	 * Test the Path against the Request Path
	 * @warn NOT FOR STATIC ROUTES
	 * @since 9.0.0
	*/ public matches(method: Method, collection: ValueCollection<string, string>, requestPath: string, requestPathSplit: string[]): boolean {
		if (this.urlMethod !== method) return false
		if (this.urlData.type === 'normal' && this.urlData.segments.length !== requestPathSplit.length) return false
		if (this.urlData.type === 'regexp' && !this.urlData.value.test(parseURL(requestPath.slice(this.urlData.prefix.length)).path)) return false
		if (this.urlData.type === 'regexp') return true

		let found = false

		const pathParams: Record<string, string> = {}
		for (let i = 1; i < requestPathSplit.length; i++) {
			const reqSegment = requestPathSplit[i], segment = this.urlData.segments[i]

			if (!segment) {
				if (this.urlData.type === 'normal') break

				found = true
				break
			}

			if (segment.params.length === 0) {
				if (segment.raw === reqSegment) {
					if (i === requestPathSplit.length - 1 && this.urlData.type === 'normal') {
						found = true
						break
					}
				} else break
			}

			const params = reqSegment.match(segment.paramsRegExp)
			if (params) {
				if (i === requestPathSplit.length - 1) found = true

				for (let i = 0; i < segment.params.length; i++) {
					pathParams[segment.params[i]] = params[i + 1]
				}
			} else break
		}

		if (found) Object.entries(pathParams).forEach(([ key, value ]) => collection.set(key, value))

		return found
	}
}