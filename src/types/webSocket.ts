import ValueCollection from "../classes/valueCollection"
import { PrintStreamOptions } from "./external"
import { Routed } from "./internal"
import { Content } from "../functions/parseContent"
import ServerController from "../classes/webServer"
import { Readable } from "stream"
import { InternalContext } from "./context"
import URLObject from "../classes/URLObject"

export default interface Websocket {
	/** The Type of this Object */ type: 'websocket'

	/** The URL as normal String */ path: string
	/** An Array of the URL split by Slashes */ pathArray: string[]
	/** The Async Code to run when the Socket Connects */ onConnect?(ctr: WebSocketConnect): Promise<any> | any
	/** The Async Code to run when the Socket recieves a Message */ onMessage?(ctr: WebSocketMessage): Promise<any> | any
	/** The Async Code to run when the Socket Closes */ onClose?(ctr: WebSocketClose): Promise<any> | any
	/** Additional Route Data */ data: {
		/** The Validations to run on this route */ validations: Routed[]
	}
}

export interface WebSocketContext {
	/** The Request Context Object from the Upgrade Event */ ctx: InternalContext
	/** The Custom Variables around the Socket */ custom: any
	/** The Params of the URL */ params: Record<string, string>
}


export interface WebSocketConnect<Custom = {}> {
	/** The Type of this Event */ type: 'connect'

	/**
	 * The Server Controller Class Instance
	 * @example
	 * ```
	 * ctr.controller.reload()
	 * ```
	 * @since 5.4.0
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
	 * @since 5.4.0
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
	 * @since 5.4.0
	*/ readonly cookies: ValueCollection<string, string>
	/**
	 * A Collection of all Path Parameters
	 * @example
	 * ```
	 * console.log(ctr.params.get('server')) // Will print undefined if not present
	 * ```
	 * @since 5.4.0
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
	 * @since 5.4.0
	*/ readonly queries: ValueCollection<string, string>
	/**
	 * A Collection of all URL Hashes
	 * @example
	 * ```
	 * if (ctr.hashes.has('user')) console.log('User Query is present')
	 * 
	 * console.log(ctr.hashes.get('user')) // Will print undefined if not present
	 * console.log(ctr.hashes.get('user', 'default')) // Will print 'default' if not present
	 * ```
	 * @since 5.7.7
	*/ readonly hashes: ValueCollection<string, string>

	/** Client Infos */ readonly client: {
		/**
		 * The User Agent of the Client
		 * @since 5.4.0
		*/ readonly userAgent: string
		/**
		 * The Port that the Client is using
		 * @since 5.4.0
		*/ readonly port: number
		/**
		 * The Ip that the Client is using
		 * @since 5.4.0
		*/ readonly ip: string
	}

	/**
	 * The Requested URL
	 * @since 5.4.0
	*/ readonly url: URLObject

	/**
	 * Set a Custom Variable
	 * @example
	 * ```
	 * ctr.setCustom('hello', 123)
	 * 
	 * ctr["@"].hello // 123
	 * ```
	 * @since 5.4.0
	*/ setCustom<Type extends keyof Custom>(name: Type, value: Custom[Type]): this
	/**
	 * Close the Socket and send a Message to the Client (automatically Formatted)
	 * @example
	 * ```
	 * ctr.close({
	 *   message: 'this is json!'
	 * })
	 * 
	 * // or
	 * 
	 * ctr.close('this is text!')
	 * ```
	 * @since 5.4.0
	*/ close(content?: Content): this
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
	 * @since 5.4.0
	*/ print(content: Content): this
	/**
	 * Print the data event of a Stream to the Client
	 * @example
	 * ```
	 * const fileStream = fs.createReadStream('./profile.png')
	 * ctr.printStream(fileStream)
	 * ```
	 * @since 5.4.0
	*/ printStream(stream: Readable, options?: PrintStreamOptions): this

	/**
	 * Custom Variables that are available in the WebSockets Context
	 * @since 5.4.0
	*/ '@': Custom
}

export interface WebSocketMessage<Custom = {}, Body = unknown> {
	/** The Type of this Event */ type: 'message'

	/**
	 * The Server Controller Class Instance
	 * @example
	 * ```
	 * ctr.controller.reload()
	 * ```
	 * @since 5.4.0
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
	 * @since 5.4.0
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
	 * @since 5.4.0
	*/ readonly cookies: ValueCollection<string, string>
	/**
	 * A Collection of all Path Parameters
	 * @example
	 * ```
	 * console.log(ctr.params.get('server')) // Will print undefined if not present
	 * ```
	 * @since 5.4.0
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
	 * @since 5.4.0
	*/ readonly queries: ValueCollection<string, string>
	/**
	 * A Collection of all URL Hashes
	 * @example
	 * ```
	 * if (ctr.hashes.has('user')) console.log('User Query is present')
	 * 
	 * console.log(ctr.hashes.get('user')) // Will print undefined if not present
	 * console.log(ctr.hashes.get('user', 'default')) // Will print 'default' if not present
	 * ```
	 * @since 5.7.7
	*/ readonly hashes: ValueCollection<string, string>

	/** Client Infos */ readonly client: {
		/**
		 * The User Agent of the Client
		 * @since 5.4.0
		*/ readonly userAgent: string
		/**
		 * The Port that the Client is using
		 * @since 5.4.0
		*/ readonly port: number
		/**
		 * The Ip that the Client is using
		 * @since 5.4.0
		*/ readonly ip: string
	}

	/**
	 * The Socket Message (JSON Automatically parsed if enabled)
	 * @since 5.4.0
	*/ readonly message: Body
	/**
	 * The Raw Socket Message
	 * @since 5.5.2
	*/ readonly rawMessage: string
	/**
	 * The Requested URL
	 * @since 5.4.0
	*/ readonly url: URLObject

	/**
	 * Set a Custom Variable
	 * @example
	 * ```
	 * ctr.setCustom('hello', 123)
	 * 
	 * ctr["@"].hello // 123
	 * ```
	 * @since 5.4.0
	*/ setCustom<Type extends keyof Custom>(name: Type, value: Custom[Type]): this
	/**
	 * Close the Socket and send a Message to the Client (automatically Formatted)
	 * @example
	 * ```
	 * ctr.close({
	 *   message: 'this is json!'
	 * })
	 * 
	 * // or
	 * 
	 * ctr.close('this is text!')
	 * ```
	 * @since 5.4.0
	*/ close(content?: Content): this
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
	 * @since 5.4.0
	*/ print(content: Content): this
	/**
	 * Print the data event of a Stream to the Client
	 * @example
	 * ```
	 * const fileStream = fs.createReadStream('./profile.png')
	 * ctr.printStream(fileStream)
	 * ```
	 * @since 5.4.0
	*/ printStream(stream: Readable, options?: PrintStreamOptions): this

	/**
	 * Custom Variables that are available in the WebSockets Context
	 * @since 5.4.0
	*/ '@': Custom
}

export interface WebSocketClose<Custom = {}, Body = unknown> {
	/** The Type of this Event */ type: 'close'

	/**
	 * The Server Controller Class Instance
	 * @example
	 * ```
	 * ctr.controller.reload()
	 * ```
	 * @since 5.4.0
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
	 * @since 5.4.0
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
	 * @since 5.4.0
	*/ readonly cookies: ValueCollection<string, string>
	/**
	 * A Collection of all Path Parameters
	 * @example
	 * ```
	 * console.log(ctr.params.get('server')) // Will print undefined if not present
	 * ```
	 * @since 5.4.0
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
	 * @since 5.4.0
	*/ readonly queries: ValueCollection<string, string>
	/**
	 * A Collection of all URL Hashes
	 * @example
	 * ```
	 * if (ctr.hashes.has('user')) console.log('User Query is present')
	 * 
	 * console.log(ctr.hashes.get('user')) // Will print undefined if not present
	 * console.log(ctr.hashes.get('user', 'default')) // Will print 'default' if not present
	 * ```
	 * @since 5.7.7
	*/ readonly hashes: ValueCollection<string, string>

	/** Client Infos */ readonly client: {
		/**
		 * The User Agent of the Client
		 * @since 5.4.0
		*/ readonly userAgent: string
		/**
		 * The Port that the Client is using
		 * @since 5.4.0
		*/ readonly port: number
		/**
		 * The Ip that the Client is using
		 * @since 5.4.0
		*/ readonly ip: string
	}

	/**
	 * The Socket Message (JSON Automatically parsed if enabled)
	 * @since 5.4.0
	*/ readonly message: Body
	/**
	 * The Raw Socket Message
	 * @since 5.5.2
	*/ readonly rawMessage: string
	/**
	 * The Requested URL
	 * @since 5.4.0
	*/ readonly url: URLObject

	/**
	 * Set a Custom Variable
	 * @example
	 * ```
	 * ctr.setCustom('hello', 123)
	 * 
	 * ctr["@"].hello // 123
	 * ```
	 * @since 5.4.0
	*/ setCustom<Type extends keyof Custom>(name: Type, value: Custom[Type]): this

	/**
	 * Custom Variables that are available in the WebSockets Context
	 * @since 5.4.0
	*/ '@': Custom
}

export type WSRequestContext = WebSocketConnect | WebSocketMessage | WebSocketClose