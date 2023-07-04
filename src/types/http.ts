import HTTPRequest from "../classes/web/HttpRequest"
import RPath from "../classes/path"
import { HTTPMethods } from "./external"
import { EndFn, MergeObjects, MiddlewareInitted, RealAny, RoutedValidation } from "./internal"
import DocumentationBuilder from "../classes/documentation/builder"

type Route<Context extends Record<any, any> = {}, Body = unknown, Middlewares extends MiddlewareInitted[] = [], Path extends string = '/'> = {
	/** The Type of this Object */ type: 'http'

	/** The Path Class related to the Route */ path: RPath

	/** The Request Method of the Route */ method: HTTPMethods
	/** The Async Code to run on every Raw Body recieved */ onRawBody?(ctr: MergeObjects<[ HTTPRequest<Context, '', Path>, InstanceType<Middlewares[number]['data']['classModifications']['http']> ]>, end: EndFn, chunk: Buffer, isLast: boolean): RealAny
	/** The Async Code to run on the Request */ onRequest(ctr: MergeObjects<[ HTTPRequest<Context, Body, Path>, InstanceType<Middlewares[number]['data']['classModifications']['http']> ]>): RealAny

	/** The Documentation of the Route */ documentation: DocumentationBuilder

	/** Additional Route Data */ data: {
		/** The Validations to run on this route */ validations: RoutedValidation[]
		/** The Headers to add to this route */ headers: Record<string, Buffer>
	}

	/** Context Data */ context: {
		/** The Default Context to use */ data: Context,
		/** Whether to keep the Context between requests */ keep: boolean
	}
}

export default Route