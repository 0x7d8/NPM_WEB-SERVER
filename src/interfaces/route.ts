import { HTTPMethods, Routed } from "./general"

export default interface Route {
	/** The Request Method of the Route */ method: HTTPMethods
	/** The URL as normal String */ path: string
	/** An Array of the URL split by Slashes */ pathArray: string[]
	/** The Async Code to run on the Request */ code: Routed
	/** Additional Route Data */ data: {
		/** Whether then some Content Types will be added automatically */ addTypes: boolean
		/** The Validations to run on this route */ validations: Routed[]
	}
}