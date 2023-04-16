import { HttpRequest, HttpResponse } from "uWebSockets.js"
import ValueCollection from "../classes/valueCollection"
import { HTTPMethods } from "./internal"
import ServerController from "../classes/webServer"
import { Readable } from "stream"
import { Content } from "../functions/parseContent"
import URLObject from "../classes/URLObject"
import Status from "../misc/statusEnum"

type UnionToIntersection<U>
	= (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never

export type MiddlewareToProps<T extends object[]>
	= T extends (infer U)[] ? Record<keyof U, UnionToIntersection<U[keyof U]>> : never

export { WSRequestContext } from "./webSocket"

export interface HTTPRequestContext<Custom = {}, Body = unknown> {
	/**
	 * The Type of the Request
	 * @since 5.7.0
	*/ type: 'http' | 'upgrade'

  /**
	 * The Server Controller Class Instance
	 * @example
	 * ```
	 * ctr.controller.reload()
	 * ```
	 * @since 3.0.0
	*/ controller: ServerController

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
	*/ readonly headers: ValueCollection<Lowercase<string>, string>
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
	*/ readonly cookies: ValueCollection<string, string>
	/**
	 * A Collection of all Path Parameters
	 * @example
	 * ```
	 * console.log(ctr.params.get('server')) // Will print undefined if not present
	 * ```
	 * @since 2.0.0
	*/ readonly params: ValueCollection<string, string>
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
	*/ readonly queries: ValueCollection<string, string>
	/**
	 * A Collection of all URL Hashes
	 * @example
	 * ```
	 * if (ctr.hashes.has('user')) console.log('User Hash is present')
	 * 
	 * console.log(ctr.hashes.get('user')) // Will print undefined if not present
	 * console.log(ctr.hashes.get('user', 'default')) // Will print 'default' if not present
	 * ```
	 * @since 5.7.7
	*/ readonly hashes: ValueCollection<string, string>

	/** Client Infos */ readonly client: {
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
	 * The Request Body (JSON Automatically parsed if enabled)
	 * @since 0.4.0
	*/ readonly body: Body
	/**
	 * The Raw Request Body
	 * @since 5.5.2
	*/ readonly rawBody: string

	/**
	 * The Requested URL
	 * @since 0.0.2
	*/ readonly url: URLObject
	/**
	 * The Domain this Request was made on
	 * @since 5.9.6
	*/ readonly domain: string

	/**
	 * The Raw HTTP Server Req Variable
	 * @since 0.2.2
	*/ rawReq: HttpRequest
	/**
	 * The Raw HTTP Server Res Variable
	 * @since 0.2.2
	*/ rawRes: HttpResponse

	/**
	 * Set an HTTP Header to add
	 * @example
	 * ```
	 * ctr.setHeader('Content-Type', 'text/plain').print('hello sir')
	 * ```
	 * @since 0.6.3
	*/ setHeader(name: string, value: Content): this
	/**
	 * Set a Custom Variable
	 * @example
	 * ```
	 * ctr.setCustom('hello', 123)
	 * 
	 * ctr["@"].hello // 123
	 * ```
	 * @since 1.2.1
	*/ setCustom<Type extends keyof Custom>(name: Type, value: Custom[Type]): this
	/**
	 * The Request Status to Send
	 * @example
	 * ```
	 * ctr.status(401).print('Unauthorized')
	 * 
	 * // or
	 * ctr.status(666, 'The Devil').print('The Devil')
	 * ```
	 * @since 0.0.2
	*/ status(code: Status, message?: string): this
	/**
	 * Redirect a Client to another URL
	 * @example
	 * ```
	 * ctr.redirect('https://example.com') // Will redirect to that URL
	 * ```
	 * @since 2.8.5
	*/ redirect(location: string, statusCode?: 301 | 302): this
	/**
	 * Print a Message to the Client (automatically Formatted)
	 * @example
	 * ```
	 * ctr.print({
	 *   message: 'this is json!'
	 * })
	 * 
	 * // or
	 * 
	 * ctr.print('this is text!')
	 * ```
	 * @since 0.0.2
	*/ print(content: Content, options?: {
		/**
		 * The Content Type to use
		 * @default ""
		 * @since 2.7.5
		*/ contentType?: string
	}): this
	/**
	 * Print the Content of a File to the Client
	 * @example
	 * ```
	 * ctr.printFile('./profile.png', {
	 *   addTypes: true // Automatically add Content types
	 * })
	 * ```
	 * @since 0.6.3
	*/ printFile(path: string, options?: {
		/**
		 * Whether some Content Type Headers will be added automatically
		 * @default true
		 * @since 2.2.0
		*/ addTypes?: boolean
		/**
		 * Whether to Cache the sent Files after accessed once (only renew after restart)
		 * @default false
		 * @since 2.2.0
		*/ cache?: boolean
	}): this
	/**
	 * Print the data event of a Stream to the Client
	 * @example
	 * ```
	 * const fileStream = fs.createReadStream('./profile.png')
	 * ctr.printStream(fileStream)
	 * 
	 * // in this case though just use ctr.printFile since it does exactly this
	 * ```
	 * @since 4.3.0
	*/ printStream(stream: Readable, options?: {
		/**
		 * Whether to end the Request after the Stream finishes
		 * @default true
		 * @since 4.3.5
		*/ endRequest?: boolean
		/**
		 * Whether to Destroy the Stream if the Request is aborted
		 * @default true
		 * @since 4.3.5
		*/ destroyAbort?: boolean
	}): this

	/**
	 * Custom Variables that are available everywhere
	 * @since 1.2.1
	*/ '@': Custom
}

export interface RouteFile<Custom = {}, Body = any> {
  /** The Request Method of the Route */ method: HTTPMethods
  /** The Request Path of the Route */ path: string

  /** The Code to run on the Request */ code: (ctr: HTTPRequestContext<Custom, Body>) => Promise<any> | any
}

export { HTTPMethods, Event }

export { default as Status } from "../misc/statusEnum"
export { default as Methods } from "../misc/methodsEnum"
export { MiddlewareProduction } from "../classes/middlewareBuilder"