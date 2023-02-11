import ctr from "./ctr"
import { Types } from "./methods"

export default interface CtrFile<Custom = any, Body = any> {
	/** The Request Method */ method: Types
	/** The Route Path */ path: string
	/** The Async Code to run on a Request */ code: (ctr: ctr<Custom, false, Body>) => Promise<any>
}