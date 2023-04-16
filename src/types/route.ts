import { HTTPRequestContext } from "./external"
import { EndFn, HTTPMethods, RealAny, RoutedValidation } from "./internal"

export default interface Route<Custom extends Record<any, any> = {}, Body = unknown> {
	/** The Type of this Object */ type: 'route'

	/** The Request Method of the Route */ method: HTTPMethods
	/** The URL as normal String */ path: string
	/** An Array of the URL split by Slashes */ pathArray: string[]
	/** The Async Code to run on every Raw Body recieved */ onRawBody?(context: Custom, end: EndFn, headers: Record<string, string>, chunk: Buffer, isLast: boolean): RealAny
	/** The Async Code to run on the Request */ onRequest(ctr: HTTPRequestContext<Custom, Body>): RealAny
	/** Additional Route Data */ data: {
		/** The Validations to run on this route */ validations: RoutedValidation[]
		/** The Headers to add to this route */ headers: Record<string, Buffer>
	}
}