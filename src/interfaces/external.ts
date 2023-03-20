import { IncomingMessage, ServerResponse } from "http"
import { Http2ServerRequest, Http2ServerResponse } from "http2"
import ValueCollection from "../classes/valueCollection"
import { HTTPMethods } from "./internal"
import ServerController from "../classes/webServer"
import Event from "./event"
import { UrlWithStringQuery } from "url"
import { Readable } from "stream"
import { GlobalContext, RequestContext } from "./context"

type UnionToIntersection<U>
	= (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never

export type MiddlewareToProps<T extends object[]>
	= T extends (infer U)[] ? Record<keyof U, UnionToIntersection<U[keyof U]>> : never

export interface PrintOptions {
	/**
	 * The Content Type to use
	 * @default ""
	*/ contentType?: string
}

export interface PrintFileOptions {
	/**
	 * Whether some Content Type Headers will be added automatically
	 * @default true
	*/ addTypes?: boolean
	/**
	 * The Content Type to use
	 * @default ""
	*/ contentType?: string
	/**
	 * Whether to Cache the sent Files after accessed once (only renew after restart)
	 * @default false
	*/ cache?: boolean
}

export interface PrintStreamOptions {
	/**
	 * Whether to end the Request after the Stream finishes
	 * @default true
	*/ endRequest?: boolean
	/**
	 * Whether to Destroy the Stream if the Request is aborted
	 * @default true
	*/ destroyAbort?: boolean
}

export interface HTTPRequestContext<Custom = {}, Body = any> {
  /** The Server Controller Class */ controller: ServerController
	/** A Collection of all Headers */ readonly headers: ValueCollection<Lowercase<string>, string>
	/** A Collection of all Cookies */ readonly cookies: ValueCollection<string, string>
	/** A Collection of all Parameters */ readonly params: ValueCollection<string, string>
	/** A Collection of all Queries */ readonly queries: ValueCollection<string, string>

	/** Client Infos */ readonly client: {
		/** The User Agent of the Client */ readonly userAgent: string
		/** The HTTP Version that the Client is using */ readonly httpVersion: string
		/** The Port that the Client is using */ readonly port: number
		/** The Ip that the Client is using */ readonly ip: string
	}

	/** The Request Body (JSON Automatically parsed) */ readonly body: Body
	/** The Requested URL */ readonly url: UrlWithStringQuery & { method: HTTPMethods }

	/** The Raw HTTP Server Req Variable */ rawReq: IncomingMessage | Http2ServerRequest
	/** The Raw HTTP Server Res Variable */ rawRes: ServerResponse | Http2ServerResponse

	/** Set an HTTP Header to add */ setHeader: (name: string, value: string | number) => this
	/** Set a Custom Variable */ setCustom: <Type extends keyof Custom>(name: Type, value: Custom[Type]) => this
	/** The Request Status to Send */ status: (code: number) => this
	/** Redirect a Client to another URL */ redirect: (location: string, statusCode?: 301 | 302) => this
	/** Print a Message to the Client (automatically Formatted) */ print: (message: any, options?: PrintOptions) => this
	/** Print the Content of a File to the Client */ printFile: (path: string, options?: PrintFileOptions) => this
	/** Print the data event of a Stream to the Client */ printStream: (stream: Readable, options?: PrintStreamOptions) => this

	/** Custom Variables that are Global */ '@': Custom
}

export interface RouteFile<Custom = {}, Body = any> {
  /** The Request Method of the Route */ method: HTTPMethods
  /** The Request Path of the Route */ path: string

  /** The Code to run on the Request */ code: (ctr: HTTPRequestContext<Custom, Body>) => Promise<any> | any
}

export interface Middleware {
  /** The Name of The Middleware */ name: string
  /** The Async Code to run on a Request */ code: (ctr: HTTPRequestContext, ctx: RequestContext, ctg: GlobalContext) => Promise<any> | any
}

export { HTTPMethods, Event }