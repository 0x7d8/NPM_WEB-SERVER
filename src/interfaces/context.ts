import valueCollection from "src/classes/valueCollection"
import ServerController from "src/classes/webServer"
import { HTTPMethods } from "./internal"
import Route from "../interfaces/route"
import { Event } from "../interfaces/external"
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
    /** The File Caches */ files: valueCollection<string, Buffer>
    /** The Route Caches */ routes: valueCollection<string, { route: Route, params: Record<string, string>, file?: string }>
  }
}

export interface RequestContext {
	/** The Content to Write */ content: Buffer
	/** Whether the Content is already compressed */ compressed: boolean
	/** The Event Emitter */ events: EventEmitter
	/** Whether waiting is required */ waiting: boolean
	/** Whether to Continue with execution */ continue: boolean
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