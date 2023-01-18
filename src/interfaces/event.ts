import ctr from "./ctr"

export type events =
  'error' |
  'request' |
  'notfound'

export default interface event {
	/** The Name of The Event */ event: events
	/** The Async Code to run on the Event */ code: (ctr: ctr<{}, boolean>) => Promise<any>
}