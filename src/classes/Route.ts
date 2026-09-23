import type { Method } from "@/types/global"
import type ValueCollection from "@/classes/ValueCollection"
import parseURL from "@/functions/parseURL"
import type { EndFn, RateLimitConfig, RealAny } from "@/types/internal"
import { isRegExp } from "util/types"
import type { UsableValidator } from "@/classes/Validator"
import type { oas31 } from "openapi3-ts"

import type HttpRequestContext from "@/classes/request/HttpRequestContext"
import type WsOpenContext from "@/classes/request/WsOpenContext"
import type WsMessageContext from "@/classes/request/WsMessageContext"
import type WsCloseContext from "@/classes/request/WsCloseContext"
import type Base from "@/classes/request/Base"

type Segment = {
	raw: string
	paramsRegExp: RegExp
	params: string[]
	/**
	 * Whether the segment is exactly one parameter (`{name}`), allowing values to skip the RegExp
	*/ wholeParam: boolean
}

function escapeRegExp(text: string): string {
	return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Build the RegExp for a segment containing parameters, literals must match exactly,
 * parameters are non-empty and lazy (split at the first occurrence of the following literal)
*/ function segmentRegExp(segment: string): RegExp {
	let source = '^', last = 0

	for (const match of segment.matchAll(/{([^}]+)}/g)) {
		source += escapeRegExp(segment.slice(last, match.index)) + '([^]+?)'
		last = match.index! + match[0].length
	}

	return new RegExp(source + escapeRegExp(segment.slice(last)) + '$')
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
	/**
	 * Whether no segment contains parameters, allowing a plain string comparison
	*/ static: boolean
}

type RequestType = 'http' | 'static' | 'ws'

type Data<Type extends RequestType> = Type extends 'http' ? {
	onRawBody?(ctr: HttpRequestContext, end: EndFn, chunk: ArrayBuffer, isLast: boolean): RealAny
	onRequest?(ctr: HttpRequestContext): RealAny
	onFinish?(ctr: Base, ms: number): RealAny
} : Type extends 'static' ? {
	folder: string
	stripHtmlEnding: boolean
} : {
	onUpgrade?(ctr: HttpRequestContext, end: EndFn): RealAny

	onOpen?(ctr: WsOpenContext): RealAny
	onOpenFinish?(ctr: Base, ms: number): RealAny
	onMessage?(ctr: WsMessageContext): RealAny
	onMessageFinish?(ctr: Base, ms: number): RealAny
	onClose?(ctr: WsCloseContext): RealAny
	onCloseFinish?(ctr: Base, ms: number): RealAny
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
					params: [],
					wholeParam: false
				}, {
					raw: '',
					paramsRegExp: new RegExp(''),
					params: [],
					wholeParam: false
				}]
			}
		} else if (typeof path === 'string') {
			const segments = parseURL(path).path.split('/')

			this.urlData = {
				type: 'normal',
				value: segments.join('/'),
				segments: [],
				static: true
			}

			for (const segment of segments) {
				const params = (segment.match(/{([^}]+)}/g) ?? []).map((m) => m.slice(1, -1))
				if (params.length) this.urlData.static = false

				this.urlData.segments.push({
					raw: segment,
					paramsRegExp: segmentRegExp(segment),
					params,
					wholeParam: params.length === 1 && segment === `{${params[0]}}`
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
	*/ public openApi: oas31.OperationObject = {}

	/**
	 * Test the Path against the Request Path
	 * @warn NOT FOR STATIC ROUTES
	 * @since 9.0.0
	*/ public matches(method: Method, collection: ValueCollection<string, string> | null, requestPath: string, requestPathSplit: string[]): boolean {
		if (this.urlMethod !== method) return false

		const urlData = this.urlData
		if (urlData.type === 'regexp') return urlData.value.test(parseURL(requestPath.slice(urlData.prefix.length)).path)

		const segments = urlData.segments, length = requestPathSplit.length
		if (segments.length !== length) return false
		if (urlData.static) return urlData.value === requestPath

		let found = false, pathParams: string[] | null = null

		for (let i = 1; i < length; i++) {
			const reqSegment = requestPathSplit[i], segment = segments[i]

			if (segment.params.length === 0) {
				if (segment.raw !== reqSegment) break
				if (i === length - 1) found = true

				continue
			}

			if (segment.wholeParam) {
				if (reqSegment.length === 0) break
				if (i === length - 1) found = true

				if (!pathParams) pathParams = []
				pathParams.push(segment.params[0], reqSegment)

				continue
			}

			const params = reqSegment.match(segment.paramsRegExp)
			if (!params) break

			if (i === length - 1) found = true

			if (!pathParams) pathParams = []
			for (let j = 0; j < segment.params.length; j++) {
				pathParams.push(segment.params[j], params[j + 1])
			}
		}

		if (found && collection && pathParams) {
			for (let i = 0; i < pathParams.length; i += 2) {
				collection.set(pathParams[i], pathParams[i + 1])
			}
		}

		return found
	}
}