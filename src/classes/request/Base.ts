import URLObject from "../URLObject"
import ValueCollection, { BaseCollection } from "@/classes/ValueCollection"
import { Content } from "@/types/global"
import Cookie from "@/classes/Cookie"
import RequestContext from "@/types/internal/classes/RequestContext"
import GlobalContext from "@/types/internal/classes/GlobalContext"
import parseKV from "@/functions/parseKV"
import { as, network } from "@rjweb/utils"

export default class Base<Context extends Record<any, any> = {}> {
	/**
	 * The Request Context Object used by the server
	 * @since 9.0.0
	*/ public context: RequestContext
	/**
	 * The Global Context Object used by the server
	 * @since 9.0.0
	*/ public global: GlobalContext

	/**
	 * Initializes a new Instance of a Web Context
	 * @since 7.0.0
	*/ constructor(context: RequestContext) {
		this.context = context
		this.global = context.global

		this.params = as<any>(context.params)
		this.headers = context.headers

		this.headers['modifyFn'] = (event, key, data) => {
			switch (event) {
				case "set": {
					context.response.headers.set(key, data)
					return
				}

				case "delete": {
					context.response.headers.delete(key)
					return
				}

				case "clear": {
					let keys = 0
					for (const cKey in context.response.headers) {
						if (!key.includes(cKey)) {
							context.response.headers.delete(key)
							keys++
						}
					}

					return keys
				}
			}
		}

		this.cookies['modifyFn'] = (event, key, data) => {
			switch (event) {
				case "set": {
					context.response.cookies.set(key, data)
					return
				}

				case "delete": {
					context.response.cookies.set(key, new Cookie('remove', { expires: 0 }))

					return
				}

				case "clear": {
					let keys = 0
					for (const [ cKey ] of this.cookies) {
						if (!key.includes(cKey)) {
							context.response.cookies.set(cKey, new Cookie('remove', { expires: 0 }))

							keys++
						}
					}

					return keys
				}
			}
		}


		let ip: network.IPAddress | null = null
		this.client = {
			userAgent: context.headers.get('user-agent', ''),
			port: context.ip.port,
			get ip() {
				if (ip) return ip

				ip = new network.IPAddress(context.ip.value)
				return ip
			}
		}

		this.url = context.url
	}
	
	/**
	 * A Collection of all Headers
	 * @example
	 * ```
	 * if (ctr.headers.has('Authorization')) console.log('Authorization Header is present')
	 * 
	 * console.log(ctr.headers.get('Authorization')) // Will print undefined if not present
	 * console.log(ctr.headers.get('Authorization', 'hello')) // Will print 'hello' if not present
	 * ```
	 * @since 2.0.0
	*/ public readonly headers: ValueCollection<string, string, Content>
	/**
	 * A Collection of all Path Parameters
	 * @example
	 * ```
	 * console.log(ctr.params.get('server')) // Will print undefined if not present
	 * ```
	 * @since 2.0.0
	*/ public readonly params: BaseCollection<string, string>

	/**
	 * A Collection of all Client Cookies
	 * @example
	 * ```
	 * import { Cookie } from "rjweb-server"
	 * 
	 * if (ctr.cookies.has('theme')) console.log('Theme Cookie is present')
	 * 
	 * console.log(ctr.cookies.get('theme')) // Will print undefined if not present
	 * console.log(ctr.cookies.get('theme', 'light')) // Will print 'light' if not present
	 * 
	 * ctr.cookies.set('session', new Cookie(Math.random(), {
	 *   path: '/'
	 * }))
	 * ```
	 * @since 2.0.0
	*/ public get cookies(): ValueCollection<string, string, Cookie> {
		if (this.context.cookies) return this.context.cookies

		this.context.cookies = as<ValueCollection<string, string, Cookie>>(parseKV('ValueCollection', this.headers.get('cookie', ''), '=', ';'))
		this.context.cookies!['modifyFn'] = (event, key, data) => {
			switch (event) {
				case "set": {
					this.context.response.cookies.set(key, data)
					return
				}

				case "delete": {
					this.context.response.cookies.set(key, new Cookie('remove', { expires: 0 }))

					return
				}

				case "clear": {
					let keys = 0
					for (const [ cKey ] of this.cookies) {
						if (!key.includes(cKey)) {
							this.context.response.cookies.set(cKey, new Cookie('remove', { expires: 0 }))

							keys++
						}
					}

					return keys
				}
			}
		}

		return this.context.cookies
	}

	/**
	 * A Collection of all URL Queries
	 * @example
	 * ```
	 * if (ctr.queries.has('user')) console.log('User Query is present')
	 * 
	 * console.log(ctr.queries.get('user')) // Will print undefined if not present
	 * console.log(ctr.queries.get('user', 'default')) // Will print 'default' if not present
	 * ```
	 * @since 2.0.0
	*/ public get queries(): BaseCollection<string, string> {
		if (this.context.queries) return this.context.queries

		this.context.queries = parseKV('ValueCollection', this.url.query)

		return this.context.queries!
	}

	/**
	 * A Collection of all URL Fragments
	 * @example
	 * ```
	 * if (ctr.fragments.has('user')) console.log('User Fragment is present')
	 * 
	 * console.log(ctr.fragments.get('user')) // Will print undefined if not present
	 * console.log(ctr.fragments.get('user', 'default')) // Will print 'default' if not present
	 * ```
	 * @since 7.0.0
	*/ public get fragments(): BaseCollection<string, string> {
		if (this.context.fragments) return this.context.fragments

		this.context.fragments = parseKV('ValueCollection', this.url.fragments)

		return this.context.fragments!
	}


	/** Client Infos */ public readonly client: {
		/**
		 * The User Agent of the Client
		 * @since 3.0.0
		*/ readonly userAgent: string
		/**
		 * The Port that the Client is using
		 * @since 3.0.0
		*/ readonly port: number
		/**
		 * The IP Address that the Client is using
		 * 
		 * When a valid Proxy Request is made (and proxy is enabled) will be the proper IP
		 * @since 3.0.0
		*/ readonly ip: network.IPAddress
	}

	/**
	 * The Requested URL
	 * @since 0.0.2
	*/ public readonly url: URLObject

	/**
	 * Context Variables that are available everywhere in the requests lifespan
	 * @since 1.2.1
	*/ public '@': Context = {} as any
}