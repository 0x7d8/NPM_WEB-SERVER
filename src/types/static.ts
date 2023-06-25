import { RoutedValidation } from "./internal"
import RPath from "../classes/path"

export default interface Static {
	/** The Type of this Object */ type: 'static'

	/** The Path Class related to the Route */ path: RPath

	/** The Location of the Folder */ location: string
	/** Additional Route Data */ data: {
		/** Whether to enable compression for files */ doCompress: boolean
		/** Whether then some Content Types will be added automatically */ addTypes: boolean
		/** Whether to automatically remove .html endings from files */ hideHTML: boolean
		/** The Validations to run on this route */ validations: RoutedValidation[]
		/** The Headers to add to this route */ headers: Record<string, Buffer>
	}
}