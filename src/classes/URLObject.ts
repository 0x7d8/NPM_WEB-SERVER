import { HTTPMethods } from "../index"
import { parse, UrlWithStringQuery } from "url"
import parsePath from "../functions/parsePath"

export default class URLObject {
	private url: UrlWithStringQuery
	private data: {
		method: HTTPMethods
	}

	/**
	 * Create a new URL object for an easy Wrapper of `url.parse()`
	 * @since 5.6.0
	*/ constructor(url: string, method: string) {
		this.url = parse(parsePath(url))
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
	*/ public get method(): HTTPMethods {
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
	*/ public get href(): string {
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
	*/ public get path(): string {
		return decodeURI(this.url.pathname ?? '/')
	}

	/**
	 * The Query of the URL
	 * @example
	 * ```
	 * // URL is https://example.com/lol/e?ok=123&test=567
	 * 
	 * url.query // "e=123&test=567"
	 * ```
	 * @since 5.6.0
	*/ public get query(): string {
		return (this.url.query ?? '').replace('?', '')
	}

	/**
	 * The Fragments of the URL
	 * @example
	 * ```
	 * // URL is https://example.com/lol/ok#u=123&test=567
	 * 
	 * url.fragments // "u=123&test=567"
	 * ```
	 * @since 5.6.0
	*/ public get fragments(): string {
		return (this.url.hash ?? '').replace('#', '')
	}
}