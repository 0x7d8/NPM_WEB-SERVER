import { HTTPMethods } from "../index"
import { parse, UrlWithStringQuery } from "url"

export const pathParser = (path: string | string[], removeSingleSlash?: boolean) => {
	if (!path) return '/'

	const paths = Array.isArray(path) ? path : [path]
	const callParse = (paths: string[]) => {
		let output = ''

		for (let pathIndex = 0; pathIndex < paths?.length; pathIndex++) {
			path = paths[pathIndex]
				.replace(/\/{2,}/g, '/')
				.replace('/?', '?')
				.replace('/#', '#')

			if (path.endsWith('?')) path = path.slice(0, -1)
			if (path.endsWith('/') && path !== '/') path = path.slice(0, -1)
			if (!path.startsWith('/') && path !== '/') path = `/${path}`

			output += (removeSingleSlash && path === '/') ? '' : path || '/'
		}

		return output
	}

	return callParse([ callParse(paths) ]).replace(/\/{2,}/g, '/')
}

export default class URLObject {
	private url: UrlWithStringQuery
	private data: {
		method: HTTPMethods
	}

	constructor(url: string, method: string) {
		this.url = parse(pathParser(url))
		this.data = {
			method: method.toUpperCase() as HTTPMethods
		}
	}

	/**
	 * The Request Method of the URL
	 * @example
	 * ```
	 * // POST https://example.com/lol/post
	 * 
	 * url.method // "POST"
	 * ```
	 * @since 5.6.0
	*/ get method(): HTTPMethods {
		return this.data.method
	}

	/**
	 * The full URL
	 * @example
	 * ```
	 * // URL is https://example.com/lol/ok?ok=124#yes=ok
	 * 
	 * url.href // "/lol/ok?ok=124#yes=ok"
	 * ```
	 * @since 5.6.0
	*/ get href(): string {
		return this.url.href ?? '/'
	}

	/**
	 * The Path of the URL
	 * @example
	 * ```
	 * // URL is https://example.com/lol/ok
	 * 
	 * url.path // "/lol/ok"
	 * ```
	 * @since 5.6.0
	*/ get path(): string {
		return this.url.pathname ?? '/'
	}

	/**
	 * The Query of the URL
	 * @example
	 * ```
	 * // URL is https://example.com/lol/ok?ok=123&test=567
	 * 
	 * url.query // "ok=123&test=567"
	 * ```
	 * @since 5.6.0
	*/ get query(): string {
		return this.url.query ?? ''
	}

	/**
	 * The Hash of the URL
	 * @example
	 * ```
	 * // URL is https://example.com/lol/ok#ok=123&test=567
	 * 
	 * url.hash // "ok=123&test=567"
	 * ```
	 * @since 5.6.0
	*/ get hash(): string {
		return (this.url.hash ?? '').replace('#', '')
	}
}