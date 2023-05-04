import ValueCollection from "../classes/valueCollection"
import ServerController from "../classes/webServer"
import Base from "../classes/web/Base"
import { Task, MiddlewareInitted } from "./internal"
import HTTP from "./http"
import URLObject from "../classes/URLObject"
import { Options } from "../functions/parseOptions"
import Static from "./static"
import { DeepRequired } from "./internal"
import TypedEventEmitter from "./typedEventEmitter"
import WebSocket from "./webSocket"
import { EventHandlerMap } from "./event"
import { HttpRequest, WsClose, WsConnect, WsMessage } from "./external"
import Reference, { RefListener } from "../classes/reference"

export type Hours =
	| '0' | '1' | '2' | '3' | '4'
	| '5' | '6' | '7' | '8' | '9'
	| '10' | '11' | '12' | '13' | '14'
	| '15' | '16' | '17' | '18' | '19'
	| '20' | '21' | '22' | '23'

export type InternalEvents = {
	startRequest(): void
	requestAborted(): void
}

export type LocalContext = {
	/** The Current Queue for Async-Sync Functions */ queue: Task[]
	/** The Previous Hours as an Array */ previousHours: Hours[]
	/** The Parsed Request URL */ url: URLObject
	/** Whether to Continue ending the Request */ continueSend: boolean
	/** Whether to Execute Route Code */ executeCode: boolean
	/** The Clients Remote IP Address */ remoteAddress: string
	/** The Error that occured while executing HTTP Logic */ error: unknown
	/** The List of Headers that the Client sent */ headers: Base['headers']
	/** The List of Cookies that the Client sent */ cookies: Base['cookies']
	/** The List of Parameters used by the URL */ params: Base['params']
	/** The List of Query Parameters used by the URL */ queries: Base['queries']
	/** The List of Fragments used by the URL */ fragments: Base['fragments']
	/** An Event Emitter Responsible for all Events */ events: TypedEventEmitter<InternalEvents>
	/** A Boolean that keeps track whether the Request is Aborted */ isAborted: boolean
	/** The Reference Listeners to keep track of and delete */ refListeners: { ref: Reference, refListener: RefListener }[]
	/** The Function to handle an Error in an Async Scenario */ handleError(err: unknown): void
	/** Schedule an Async Task for Execution */ scheduleQueue(type: Task['type'], callback: Task['function']): void
	/** Run all current Functions contained in the Queue */ runQueue(): Promise<Error | null>

	/** The Current Request Body */ body: {
		/** The Body as Chunks */ chunks: Buffer[]
		/** The Body as a raw Buffer */ raw: Buffer
		/** The Body as a parsed Object */ parsed: any
	}

	/** The Execute Object */ execute: {
		/** The Route Object that was found */ route: HTTP | Static | WebSocket | null
		/** The File to Read when Route is Static */ file: string | null
		/** Whether the Route exists */ exists: boolean
		/** The Event to execute instead of the Route */ event: 'none' | keyof EventHandlerMap<any, any>
	}

	/** The Response Object */ response: {
		/** The Headers to Respond with */ headers: Record<string, Buffer | string>
		/** The HTTP Status to Respond with */ status: number
		/** The HTTP Status Message to concat to the Code */ statusMessage: string | undefined
		/** Whether the Current Content is Compressed */ isCompressed: boolean
		/** The Raw Content to Send */ content: Buffer
	}
}

export type GlobalContext = {
	/** The Server Controller Class */ controller: ServerController<any>
	/** The File -> Content Type Mapping */ contentTypes: Record<string, string>
	/** The Default HTTP Headers List */ defaultHeaders: Record<string, Buffer>
	/** The HTTP Server Options */ options: DeepRequired<Options>
	/** The Request Count */ requests: Record<Hours | 'total', number>
	/** The Middlewares to run */ middlewares: MiddlewareInitted[]

	/** The WebSocket Stats */ webSockets: {
		/** The Amount of Sockets Opened */ opened: Record<Hours | 'total', number>
		/** The Amount of Socket Messages recieved */ messages: {
			/** The Incoming Message Count */ incoming: Record<Hours | 'total', number>
			/** The Outgoing Message Count */ outgoing: Record<Hours | 'total', number>
		}
	}

	/** The Modified Classes to use for Creation of Contexts */ classContexts: {
		http: typeof HttpRequest
		wsConnect: typeof WsConnect
		wsMessage: typeof WsMessage
		wsClose: typeof WsClose
	}

	/** The Data Stats */ data: {
		/** The Incoming Data Count */ incoming: Record<Hours | 'total', number>
		/** The Outgoing Data Count */ outgoing: Record<Hours | 'total', number>
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