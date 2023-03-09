import ctr from "./ctr"

export type Events =
  'error' |
  'request' |
  'notfound'

export default interface Event {
	/** The Name of The Event */ event: Events
	/** The Async Code to run on the Event */ code: (ctr: ctr<any, boolean, {}>) => Promise<any> | any
}