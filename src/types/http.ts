import Server from "../classes/webServer"
import { HttpRequest, HttpResponse } from "uWebSockets.js"
import ValueCollection from "../classes/valueCollection"
import URLObject from "../classes/URLObject"
import { HTTPMethods } from "./external"
import { Readable } from "stream"
import { Content } from "../functions/parseContent"
import { EndFn, RealAny, RoutedValidation } from "./internal"

export default interface Route<Custom extends Record<any, any> = {}, Body = unknown> {
	/** The Type of this Object */ type: 'route'

	/** The Request Method of the Route */ method: HTTPMethods
	/** The URL as normal String */ path: string
	/** An Array of the URL split by Slashes */ pathArray: string[]
	/** The Async Code to run on every Raw Body recieved */ onRawBody?(context: Custom, end: EndFn, headers: Record<string, string>, chunk: Buffer, isLast: boolean): RealAny
	/** The Async Code to run on the Request */ onRequest(ctr: HTTPRequestContext<Custom, Body>): RealAny
	/** Additional Route Data */ data: {
		/** The Validations to run on this route */ validations: RoutedValidation[]
		/** The Headers to add to this route */ headers: Record<string, Buffer>
	}
}

export interface HTTPRequestContext<Context extends Record<any, any> = {}, Body = unknown> {
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
	*/ controller: Server

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
		*/ readonly userAgent: string | null
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
	*/ setCustom<T extends keyof Context>(name: T, value: Context[T]): this
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
	*/ status(code: number, message?: string): this
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
		/**
		 * Whether to prettify output (mostly just JSONs)
		 * @default false
		 * @since 6.2.0
		*/ prettify?: boolean
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
	 * Context Variables that are available everywhere in the requests lifespan
	 * @since 1.2.1
	*/ '@': Context
}