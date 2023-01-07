import types from "../misc/types"
import ctr from "./ctr"

export default interface page {
	array: string[]
  path: string
	type: typeof types[number]
	addTypes: boolean
	code: (ctr: ctr) => any
	content?: any
}