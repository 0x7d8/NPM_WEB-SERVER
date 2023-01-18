import ctr from "./ctr"
import { types } from "./types"

export default interface ctrFile<Custom = any, Body = {}> {
	/** The Request Method */ method: types
	/** The Route Path */ path: string
	/** The Async Code to run on a Request */ code: (ctr: ctr<Custom, false, Body>) => Promise<any>
}