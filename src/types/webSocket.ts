import HTTPRequest from "../classes/web/HttpRequest"
import { MergeObjects, MiddlewareInitted, RealAny, RoutedValidation } from "./internal"
import { LocalContext } from "./context"

import WSConnect from "../classes/web/WsConnect"
import WSMessage from "../classes/web/WsMessage"
import WSClose from "../classes/web/WsClose"

interface RouteGeneral<Context extends Record<any, any> = {}, Message = unknown, Middlewares extends MiddlewareInitted[] = []> {
	/** The Type of this Object */ type: 'websocket'

	/** The Async Code to run when the Socket gets an Upgrade HTTP Request */ onUpgrade?(ctr: MergeObjects<[ HTTPRequest<Context, ''>, InstanceType<Middlewares[number]['data']['classModifications']['http']> ]>, end: (...args: any[]) => void): Promise<any> |any
	/** The Async Code to run when the Socket Connects */ onConnect?(ctr: MergeObjects<[ WSConnect<Context>, InstanceType<Middlewares[number]['data']['classModifications']['wsConnect']> ]>): RealAny
	/** The Async Code to run when the Socket recieves a Message */ onMessage?(ctr: MergeObjects<[ WSMessage<Context, Message>, InstanceType<Middlewares[number]['data']['classModifications']['wsMessage']> ]>): RealAny
	/** The Async Code to run when the Socket Closes */ onClose?(ctr: MergeObjects<[ WSClose<Context, Message>, InstanceType<Middlewares[number]['data']['classModifications']['wsClose']> ]>): RealAny

	/** Additional Route Data */ data: {
		/** The Validations to run on this route */ validations: RoutedValidation[]
	}

	/** Context Data */ context: {
		/** The Default Context to use */ data: Context,
		/** Whether to keep the Context between requests */ keep: boolean
	}
}

interface RouteString<Context extends Record<any, any> = {}, Message = unknown, Middlewares extends MiddlewareInitted[] = []> extends RouteGeneral<Context, Message, Middlewares> {
	/** The URL as normal String */ path: string
	/** An Array of Path Sections split by slashes */ pathArray: string[]
}

interface RouteRegExp<Context extends Record<any, any> = {}, Message = unknown, Middlewares extends MiddlewareInitted[] = []> extends RouteGeneral<Context, Message, Middlewares> {
	/** The URL as Regular Expression */ path: RegExp
	/** The Path that the URL has to start with */ pathStartWith: string
}

type Route<Context extends Record<any, any> = {}, Message = unknown, Middlewares extends MiddlewareInitted[] = []> = RouteString<Context, Message, Middlewares> | RouteRegExp<Context, Message, Middlewares>
export default Route



export type WebSocketContext = {
	/** The Request Context Object from the Upgrade Event */ ctx: LocalContext
	/** The Custom Variables around the Socket */ custom: any
}