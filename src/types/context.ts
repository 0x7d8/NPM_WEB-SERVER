import ValueCollection from "../classes/valueCollection"
import ServerController from "../classes/webServer"
import { Task } from "./internal"
import Route from "./route"
import { Event, MiddlewareProduction } from "./external"
import URLObject from "../classes/URLObject"
import { Options } from "../classes/serverOptions"
import Static from "./static"
import { DeepRequired } from "./internal"
import TypedEventEmitter from "./typedEventEmitter"
import WebSocket from "./webSocket"

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

export interface InternalContext {
	/** The Current Queue for Async-Sync Functions */ queue: Task[]
	/** The Previous Hours as an Array */ previousHours: Hours[]
	/** The Parsed Request URL */ url: URLObject
	/** Whether to Continue ending the Request */ continueSend: boolean
	/** Whether to Execute Route Code */ executeCode: boolean
	/** The Clients Remote IP Address */ remoteAddress: string
	/** The Error that occured while executing HTTP Logic */ error: Error | null
	/** The List of Headers that the Client sent */ headers: Record<string, string>
	/** The List of Cookies that the Client sent */ cookies: Record<string, string>
	/** An Event Emitter Responsible for all Events */ events: TypedEventEmitter<InternalEvents>
	/** The Function to handle an Error in an Async Scenario */ handleError(err: Error | null): void
	/** Schedule an Async Task for Execution */ scheduleQueue(type: Task['type'], callback: Task['function']): void
	/** Run all current Functions contained in the Queue */ runQueue(): Promise<Error | null>

	/** The Current Request Body */ body: {
		/** The Body as a raw Buffer */ raw: Buffer
		/** The Body as a parsed Object */ parsed: any
	}

	/** The Execute Object */ execute: {
		/** The Route Object that was found */ route: Route | Static | WebSocket | null
		/** The File to Read when Route is Static */ file: string | null
		/** Whether the Route exists */ exists: boolean
		/** The Event to execute instead of the Route */ event: 'none' | Event['name']
	}

	/** The Response Object */ response: {
		/** The Headers to Respond with */ headers: Record<string, string>
		/** The HTTP Status to Respond with */ status: number
		/** Whether the Current Content is Compressed */ isCompressed: boolean
		/** The Raw Content to Send */ content: Buffer
	}
}

export interface GlobalContext {
	/** The Server Controller Class */ controller: ServerController
	/** The File -> Content Type Mapping */ contentTypes: Record<string, string>
	/** The Default HTTP Headers List */ defaultHeaders: Record<string, string>
	/** The HTTP Server Options */ options: DeepRequired<Options>
	/** The Request Count */ requests: Record<Hours | 'total', number>
	/** The Middlewares to run */ middlewares: ReturnType<MiddlewareProduction['init']>[]
	/** The WebSocket Stats */ webSockets: {
		/** The Amount of Sockets Opened */ opened: Record<Hours | 'total', number>
		/** The Amount of Socket Messages recieved */ messages: {
			/** The Incoming Message Count */ incoming: Record<Hours | 'total', number>
			/** The Outgoing Message Count */ outgoing: Record<Hours | 'total', number>
		}
	}

	/** The Data Stats */ data: {
		/** The Incoming Data Count */ incoming: Record<Hours | 'total', number>
		/** The Outgoing Data Count */ outgoing: Record<Hours | 'total', number>
	}

  /** The Routes */ routes: {
    /** Normal Routes */ normal: Route[]
		/** Websocket Routes */ websocket: WebSocket[]
		/** Static Routes */ static: Static[]
    /** Event Routes */ event: Event[]
  }

  /** The Cache Stores */ cache: {
    /** The File Caches */ files: ValueCollection<string, Buffer>
    /** The Route Caches */ routes: ValueCollection<string, { route: Route | Static | WebSocket, params?: Record<string, string>, file?: string }>
  }
}