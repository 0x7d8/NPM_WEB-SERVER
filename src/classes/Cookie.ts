import { Content } from "@/types/global"

type CookieData = {
	/**
	 * The Domain this Cookie will be assigned to.
	 * 
	 * If not provided will not be used in the Cookie Header.
	 * @default null
	 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie#attributes
	 * @since 9.0.0
	*/ domain?: string
	/**
	 * Whether the Cookie should be HTTP only
	 * @default false
	 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie#attributes
	 * @since 9.0.0
	*/ httpOnly?: boolean
	/**
	 * Whether the Cookie should be Secure (HTTPS only)
	 * @default false
	 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie#attributes
	 * @since 9.0.0
	*/ secure?: boolean
	/**
	 * The Path under which to save the Cookie
	 * @default "/"
	 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie#attributes
	 * @since 9.0.0
	*/ path?: string
	/**
	 * The SameSite Attribute of the Cookie
	 * @default false
	 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie#attributes
	 * @since 9.0.0
	*/ sameSite?: false | 'strict' | 'lax' | 'none'

	/**
	 * The Date or seconds in which the Cookie will expire
	 * 
	 * If not provided will create a "Session Cookie".
	 * @default null
	 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie#attributes
	 * @since 9.0.0
	*/ expires?: Date | number
}

export default class Cookie {
	/**
	 * Create a new Cookie
	 * @example
	 * ```
	 * import { Cookie } from "rjweb-server"
	 * 
	 * const cookie = new Cookie('value', {
	 *   expires: 50000
	 * })
	 * ```
	 * @since 9.0.0
	*/ constructor(value: Content, data?: CookieData) {
		this.value = value
		this.domain = data?.domain || null
		this.expires = data?.expires || null
		this.httpOnly = data?.httpOnly || false
		this.path = data?.path || '/'
		this.sameSite = data?.sameSite || false
		this.secure = data?.secure || false
	}

	/**
	 * The Domain this Cookie will be assigned to.
	 * 
	 * If not provided will not be used in the Cookie Header.
	 * @default null
	 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie#attributes
	 * @since 9.0.0
	*/ public readonly domain: string | null
	/**
	 * Whether the Cookie should be HTTP only
	 * @default false
	 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie#attributes
	 * @since 9.0.0
	*/ public readonly httpOnly: boolean
	/**
	 * Whether the Cookie should be Secure (HTTPS only)
	 * @default false
	 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie#attributes
	 * @since 9.0.0
	*/ public readonly secure: boolean
	/**
	 * The Path under which to save the Cookie
	 * @default "/"
	 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie#attributes
	 * @since 9.0.0
	*/ public readonly path: string
	/**
	 * The SameSite Attribute of the Cookie
	 * @default false
	 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie#attributes
	 * @since 9.0.0
	*/ public readonly sameSite: false | 'strict' | 'lax' | 'none'

	/**
	 * The Date or seconds in which the Cookie will expire
	 * 
	 * If not provided will create a "Session Cookie".
	 * @default null
	 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie#attributes
	 * @since 9.0.0
	*/ public readonly expires: Date | number | null

	/**
	 * The Value of the Cookie
	 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie#attributes
	 * @since 9.0.0
	*/ public readonly value: Content
}