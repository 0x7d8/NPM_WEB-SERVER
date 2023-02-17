import valueCollection from "src/classes/valueCollection"
import ServerController from "src/classes/serverController"
import typesEnum from "../interfaces/methods"
import Route from "../interfaces/route"
import Event from "../interfaces/event"
import { EventEmitter } from "stream"
import { UrlWithStringQuery } from "url"
import Ctr from "./ctr"

export type hours =
	| '0' | '1' | '2' | '3' | '4'
	| '5' | '6' | '7' | '8' | '9'
	| '10' | '11' | '12' | '13' | '14'
	| '15' | '16' | '17' | '18' | '19'
	| '20' | '21' | '22' | '23'

export interface GlobalContext {
	/** The Server Controller Class */ controller: ServerController
	/** The Request Count */ requests: Record<hours | 'total', number>
	/** The 404 Page Display */ pageDisplay: string
	/** The Data Stats */ data: {
		/** The Incoming Data Count */ incoming: Record<hours | 'total', number>
		/** The Outgoing Data Count */ outgoing: Record<hours | 'total', number>
	}

  /** The Routes */ routes: {
    /** Normal Routes */ normal: Route[]
    /** Event Routes */ event: Event[]
		/** Auth Routes */ auth: { path: string, func: (ctr: Ctr) => Promise<any> | any }[]
  }

  /** The Cache Stores */ cache: {
    /** The File Caches */ files: valueCollection<string, Buffer>
    /** The Route Caches */ routes: valueCollection<string, { route: Route, params: Record<string, string> }>
		/** The Auth Caches */ auths: valueCollection<string, { path: string, func: (ctr: Ctr) => Promise<any> | any }[]>
  }
}

export interface RequestContext {
	/** The Content to Write */ content: Buffer
	/** Whether the Content is already compressed */ compressed: boolean
	/** The Event Emitter */ events: EventEmitter
	/** The Function to Check Authentication */ authChecks: ((ctr: Ctr) => Promise<any> | any)[]
	/** Whether waiting is required */ waiting: boolean
	/** Whether to Continue with execution */ continue: boolean
	/** The Execute URL Object */ execute: {
		/** The Route Object that was found */ route: Route
		/** Whether the Route is Static */ static: boolean
		/** Whether the Route exists */ exists: boolean
		/** Whether the Route is the Dashboard */ dashboard: boolean
	}

	/** The Request Body */ body: {
		/** Unparsed Body */ raw: Buffer
		/** Parsed Body */ parsed: any
	}

	/** The Request URL */ url: UrlWithStringQuery & { method: typesEnum }
	/** Previous Hour Object */ previousHours: number[]
}