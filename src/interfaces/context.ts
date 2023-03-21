import ValueCollection from "../classes/valueCollection"
import ServerController from "../classes/webServer"
import { HTTPMethods } from "./internal"
import Route from "../interfaces/route"
import { Event, Middleware } from "../interfaces/external"
import { EventEmitter } from "stream"
import { UrlWithStringQuery } from "url"
import { Options } from "../classes/serverOptions"
import Static from "./static"

export type Hours =
	| '0' | '1' | '2' | '3' | '4'
	| '5' | '6' | '7' | '8' | '9'
	| '10' | '11' | '12' | '13' | '14'
	| '15' | '16' | '17' | '18' | '19'
	| '20' | '21' | '22' | '23'

export interface GlobalContext {
	/** The Server Controller Class */ controller: ServerController
	/** The HTTP Server Options */ options: Options
	/** The Request Count */ requests: Record<Hours | 'total', number>
	/** The Middlewares to run */ middlewares: Middleware[]
	/** The Data Stats */ data: {
		/** The Incoming Data Count */ incoming: Record<Hours | 'total', number>
		/** The Outgoing Data Count */ outgoing: Record<Hours | 'total', number>
	}

  /** The Routes */ routes: {
    /** Normal Routes */ normal: Route[]
		/** Static Routes */ static: Static[]
    /** Event Routes */ event: Event[]
  }

  /** The Cache Stores */ cache: {
    /** The File Caches */ files: ValueCollection<string, Buffer>
    /** The Route Caches */ routes: ValueCollection<string, { route: Route, params: Record<string, string>, file?: string }>
  }
}

export interface RequestContext {
	/** The Content to Write */ content: Buffer
	/** Whether the Content is already compressed */ compressed: boolean
	/** The Event Emitter */ events: EventEmitter
	/** Whether to wait for a non Queue Async Event */ waiting: boolean
	/** The Current Async Queue to await */ queue: Function[]
	/** Schedule an Async Task for Execution */ addToQueue: (callback: Function) => number
	/** Whether to Continue with execution */ continue: boolean
	/** The Function to handle an Error in a Async Middleware */ handleError: (err: Error) => void
	/** The Response Status that will be sent */ status: number
	/** The Headers the Request was made with */ headers: Record<Lowercase<string>, string>
	/** The Headers scheduled to be sent */ sendHeaders: Record<Lowercase<string>, string>
	/** The Remote IP as Buffer */ remote: Buffer
	/** The Execute URL Object */ execute: {
		/** The Route Object that was found */ route: Route | Static
		/** The File to Read when Route is Static */ file: string
		/** Whether the Route exists */ exists: boolean
		/** Whether the Route is the Dashboard */ dashboard: boolean
	}

	/** The Request Body */ body: {
		/** Body Chunks */ chunks: Buffer[]
		/** Unparsed Body */ raw: Buffer
		/** Parsed Body */ parsed: any
	}

	/** The Request URL */ url: UrlWithStringQuery & { method: HTTPMethods }
	/** Previous Hour Object */ previousHours: number[]
}