import HTTPRequest from "../classes/web/HttpRequest"
import { HTTPMethods } from "./external"
import { EndFn, MergeObjects, MiddlewareInitted, RealAny, RoutedValidation } from "./internal"

interface RouteGeneral<Context extends Record<any, any> = {}, Body = unknown, Middlewares extends MiddlewareInitted[] = [], Path extends string = '/'> {
	/** The Type of this Object */ type: 'http'

	/** The Request Method of the Route */ method: HTTPMethods
	/** The Async Code to run on every Raw Body recieved */ onRawBody?(ctr: MergeObjects<[ HTTPRequest<Context, '', Path>, InstanceType<Middlewares[number]['data']['classModifications']['http']> ]>, end: EndFn, chunk: Buffer, isLast: boolean): RealAny
	/** The Async Code to run on the Request */ onRequest(ctr: MergeObjects<[ HTTPRequest<Context, Body, Path>, InstanceType<Middlewares[number]['data']['classModifications']['http']> ]>): RealAny

	/** Additional Route Data */ data: {
		/** The Validations to run on this route */ validations: RoutedValidation[]
		/** The Headers to add to this route */ headers: Record<string, Buffer>
	}

	/** Context Data */ context: {
		/** The Default Context to use */ data: Context,
		/** Whether to keep the Context between requests */ keep: boolean
	}
}

interface RouteString<Context extends Record<any, any> = {}, Body = unknown, Middlewares extends MiddlewareInitted[] = [], Path extends string = '/'> extends RouteGeneral<Context, Body, Middlewares, Path> {
	/** The URL as normal String */ path: string
	/** An Array of Path Sections split by slashes */ pathArray: string[]
}

interface RouteRegExp<Context extends Record<any, any> = {}, Body = unknown, Middlewares extends MiddlewareInitted[] = [], Path extends string = '/'> extends RouteGeneral<Context, Body, Middlewares, Path> {
	/** The URL as Regular Expression */ path: RegExp
	/** The Path that the URL has to start with */ pathStartWith: string
}

type Route<Context extends Record<any, any> = {}, Body = unknown, Middlewares extends MiddlewareInitted[] = [], Path extends string = '/'> = RouteString<Context, Body, Middlewares, Path> | RouteRegExp<Context, Body, Middlewares, Path>
export default Route