import { GlobalContext, LocalContext } from "../../types/context"
import URLObject from "../URLObject"
import ValueCollection from "../valueCollection"
import Server from "../server"
import { ExctractParameters } from "../../types/internal"

export default class Base<Context extends Record<any, any> = {}, Path extends string = '/'> {
	protected ctx: LocalContext
	protected ctg: GlobalContext

	/**
	 * Initializes a new Instance of a Web Context
	 * @since 7.0.0
	*/ constructor(controller: Server<any>, localContext: LocalContext) {
		this.ctx = localContext
		this.ctg = controller['globalContext']
		this.controller = controller

		this.headers = localContext.headers
		this.cookies = localContext.cookies
		this.params = localContext.params as ValueCollection<any, string>
		this.queries = localContext.queries
		this.fragments = localContext.fragments

		let hostIp: string
		if (this.ctg.options.proxy && this.ctx.headers.has('x-forwarded-for')) hostIp = this.ctx.headers.get('x-forwarded-for', '').split(',')[0].trim()
		else hostIp = this.ctx.remoteAddress.split(':')[0]

		this.client = {
			userAgent: localContext.headers.get('user-agent', ''),
			port: parseInt(localContext.remoteAddress.split(':')[1]),
			ip: hostIp
		}

		this.url = localContext.url
		this.domain = localContext.headers.get('host', '')
	}

	/**
	 * The Server Controller Class Instance
	 * @example
	 * ```
	 * ctr.controller.reload()
	 * ```
	 * @since 3.0.0
	*/ public controller: Server<any, any>



	
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
	*/ public readonly headers: ValueCollection<string, string>
	/**
	 * A Collection of all Client Cookies
	 * @example
	 * ```
	 * if (ctr.cookies.has('theme')) console.log('Theme Cookie is present')
	 * 
	 * console.log(ctr.cookies.get('theme')) // Will print undefined if not present
	 * console.log(ctr.cookies.get('theme', 'light')) // Will print 'light' if not present
	 * ```
	 * @since 2.0.0
	*/ public readonly cookies: ValueCollection<string, string>
	/**
	 * A Collection of all Path Parameters
	 * @example
	 * ```
	 * console.log(ctr.params.get('server')) // Will print undefined if not present
	 * ```
	 * @since 2.0.0
	*/ public readonly params: ValueCollection<keyof ExctractParameters<Path> extends never ? string : keyof ExctractParameters<Path>, string>
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
	*/ public readonly queries: ValueCollection<string, string>
	/**
	 * A Collection of all URL Fragments
	 * @example
	 * ```
	 * if (ctr.fragments.has('user')) console.log('User Hash is present')
	 * 
	 * console.log(ctr.fragments.get('user')) // Will print undefined if not present
	 * console.log(ctr.fragments.get('user', 'default')) // Will print 'default' if not present
	 * ```
	 * @since 7.0.0
	*/ public readonly fragments: ValueCollection<string, string>

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
		 * The Ip that the Client is using
		 * @since 3.0.0
		*/ readonly ip: string
	}

	/**
	 * The Requested URL
	 * @since 0.0.2
	*/ public readonly url: URLObject
	/**
	 * The Domain this Request was made on
	 * @since 5.9.6
	*/ public readonly domain: string

	/**
	 * Set a Custom Variable
	 * @example
	 * ```
	 * ctr.setCustom('hello', 123)
	 * 
	 * ctr["@"].hello // 123
	 * ```
	 * @since 1.2.1
	*/ public setCustom<T extends keyof Context>(name: T, value: Context[T]): this {
		this["@"][name] = value

		return this
	}

	/**
	 * Context Variables that are available everywhere in the requests lifespan
	 * @since 1.2.1
	*/ public '@': Context = {} as any
}