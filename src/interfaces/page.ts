import { types } from "@/interfaces/types"
import ctr from "@/interfaces/ctr"

export default interface page {
	/** An Array of the URL split by slashes */ array: string[]
  /** The URL as normal String */ path: string
	/** The HTTP Request Type */ type: types
	/** If true then some Content Types will be added automatically */ addTypes: boolean
	/** The Async Code to run on a Request */ code: (ctr: ctr) => void
	/** The File Content (If Preloading) */ content?: any
}