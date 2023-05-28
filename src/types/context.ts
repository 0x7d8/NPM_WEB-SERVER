import ValueCollection from "../classes/valueCollection"
import Server from "../classes/server"
import Base from "../classes/web/Base"
import { MiddlewareInitted } from "./internal"
import HTTP from "./http"
import URLObject from "../classes/URLObject"
import { Options } from "../functions/parseOptions"
import Static from "./static"
import { DeepRequired } from "./internal"
import MiniEventEmitter from "../classes/miniEventEmitter"
import WebSocket from "./webSocket"
import { EventHandlerMap } from "./event"
import { HttpRequest, WsClose, WsConnect, WsMessage } from "./external"
import Reference, { RefListener } from "../classes/reference"
import { Content } from "../functions/parseContent"
import DataStat from "../classes/dataStat"
import Logger from "../classes/logger"

export type Hours =
	| '0' | '1' | '2' | '3' | '4'
	| '5' | '6' | '7' | '8' | '9'
	| '10' | '11' | '12' | '13' | '14'
	| '15' | '16' | '17' | '18' | '19'
	| '20' | '21' | '22' | '23'

type ExecuteFound = {
	event: 'none' | keyof EventHandlerMap<any, any>
	found: true
	route: HTTP | WebSocket
	file: null
}

type ExecuteFoundStatic = {
	event: 'none' | keyof EventHandlerMap<any, any>
	found: true
	route: Static
	file: string
}

type ExecuteNotFound = {
	event: 'none' | keyof EventHandlerMap<any, any>
	found: false
	route: null
	file: null
}

type Execute = ExecuteFound | ExecuteFoundStatic | ExecuteNotFound

export type InternalEvents = {
	startRequest(): void
	requestAborted(): void
}

export type LocalContext = {
	/** The Code to execute custom */ executeSelf: () => boolean | Promise<boolean>
	/** The Parsed Request URL */ url: URLObject
	/** Whether to Continue sending the Request */ continueSend: boolean
	/** Whether to Execute Route Code */ executeCode: boolean
	/** The Clients Remote IP Address */ remoteAddress: string
	/** The Error that occured while executing HTTP Logic */ error: unknown
	/** The List of Headers that the Client sent */ headers: Base['headers']
	/** The List of Cookies that the Client sent */ cookies: ValueCollection<string, string>
	/** The List of Parameters used by the URL */ params: ValueCollection<string, string>
	/** The List of Query Parameters used by the URL */ queries: ValueCollection<string, string>
	/** The List of Fragments used by the URL */ fragments: ValueCollection<string, string>
	/** An Event Emitter Responsible for all Events */ events: MiniEventEmitter<InternalEvents>
	/** Whether this request was made from a proxy and is valid */ isProxy: boolean
	/** A Boolean that keeps track whether the Request is Aborted */ isAborted: boolean
	/** The Reference Listeners to keep track of and delete */ refListeners: { ref: Reference, refListener: RefListener }[]

	/** The Function to handle an Error in an Async Scenario */ handleError(err: unknown): void
	/** Set the Code to run when executeCode is false */ setExecuteSelf(callback: LocalContext['executeSelf']): void

	/** The Current Request Body */ body: {
		/** The Type of the Body */ type: 'unknown' | 'json' | 'url-encoded' | 'multipart'
		/** The Body as Chunks */ chunks: Buffer[]
		/** The Body as a raw Buffer */ raw: Buffer
		/** The Body as a parsed Object */ parsed: any
	}

	/** The Execute Object */ execute: Execute

	/** The Response Object */ response: {
		/** The Headers to Respond with */ headers: Record<string, Content>
		/** The HTTP Status to Respond with */ status: number
		/** The HTTP Status Message to concat to the Code */ statusMessage: string | undefined
		/** Whether the Current Content is Compressed */ isCompressed: boolean

		/** The Raw Content to Send */ content: Content
		/** Whether to prettify Content */ contentPrettify: boolean
	}
}

export type GlobalContext = {
	/** The Server Controller Class */ controller: Server<any, any>
	/** The File -> Content Type Mapping */ contentTypes: Record<string, string>
	/** The Logger to use for everything internal */ logger: Logger
	/** The HTTP Server Options */ options: DeepRequired<Options>
	/** The Request Count */ requests: DataStat
	/** The Middlewares to run */ middlewares: MiddlewareInitted[]

	/** The WebSocket Stats */ webSockets: {
		/** The Amount of Sockets Opened */ opened: DataStat
		/** The Amount of Socket Messages recieved */ messages: {
			/** The Incoming Message Count */ incoming: DataStat
			/** The Outgoing Message Count */ outgoing: DataStat
		}
	}

	/** Some Default Values */ defaults: {
		/** The Default GlobalContext Values */ globContext: Record<any, any>
		/** The Default Headers to add */ headers: Record<string, Buffer>
	}

	/** The Modified Classes to use for Creation of Contexts */ classContexts: {
		http: typeof HttpRequest
		wsConnect: typeof WsConnect
		wsMessage: typeof WsMessage
		wsClose: typeof WsClose
	}

	/** The Data Stats */ data: {
		/** The Incoming Data Count */ incoming: DataStat
		/** The Outgoing Data Count */ outgoing: DataStat
	}

  /** The Routes */ routes: {
    /** Normal Routes */ normal: HTTP[]
		/** Websocket Routes */ websocket: WebSocket[]
		/** Static Routes */ static: Static[]

		/** HTML Builder Registered Routes */ htmlBuilder: HTTP[]
  }

  /** The Cache Stores */ cache: {
    /** The File Caches */ files: ValueCollection<string, Buffer>
		/** The Middleware Cache (tip: save keys as "middleware:key" or similar to avoid duplicates from other middlewares) */ middlewares: ValueCollection<string, any>
    /** The Route Caches */ routes: ValueCollection<string, { route: HTTP | Static | WebSocket, params?: ValueCollection<string, string>, file?: string }>
  }
}