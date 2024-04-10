import { Method } from "@/types/global"
import parseURL from "@/functions/parseURL"

/**
 * A Utility to wrap a parsed URL
 * @example
 * ```
 * const url = new URLObject(...)
 * ```
 * @since 5.6.0
*/ export default class URLObject {
	/**
	 * Create a new URL object for an easier Wrapper of `parseURL()`
	 * @since 5.6.0
	*/ constructor(url: string, method: Method) {
		const parsed = parseURL(url)

		this.href = parsed.href
		this.path = parsed.path
		this.query = parsed.query
		this.fragments = parsed.fragments

		this.method = method
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
	*/ public readonly method: Method

	/**
	 * The full URL
	 * @example
	 * ```
	 * // URL is https://example.com/lol/ok?ok=124#yes=ok
	 * 
	 * url.href // "/lol/ok?ok=124#yes=ok"
	 * ```
	 * @since 5.6.0
	*/ public readonly href: string

	/**
	 * The Path of the URL
	 * @example
	 * ```
	 * // URL is https://example.com/lol/ok
	 * 
	 * url.path // "/lol/ok"
	 * ```
	 * @since 5.6.0
	*/ public readonly path: string

	/**
	 * The Query of the URL
	 * @example
	 * ```
	 * // URL is https://example.com/lol/e?ok=123&test=567
	 * 
	 * url.query // "e=123&test=567"
	 * ```
	 * @since 5.6.0
	*/ public readonly query: string

	/**
	 * The Fragments of the URL
	 * @example
	 * ```
	 * // URL is https://example.com/lol/ok#u=123&test=567
	 * 
	 * url.fragments // "u=123&test=567"
	 * ```
	 * @since 5.6.0
	*/ public readonly fragments: string
}