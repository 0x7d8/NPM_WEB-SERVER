import HTTPRequest from "../classes/web/HttpRequest"
import RPath from "../classes/path"
import { MergeObjects, MiddlewareInitted, RealAny, RoutedValidation } from "./internal"
import { LocalContext } from "./context"

import WSConnect from "../classes/web/WsConnect"
import WSMessage from "../classes/web/WsMessage"
import WSClose from "../classes/web/WsClose"

type Route<Context extends Record<any, any> = {}, Message = unknown, Middlewares extends MiddlewareInitted[] = [], Path extends string = '/'> = {
	/** The Type of this Object */ type: 'websocket'

	/** The Path Class related to the Route */ path: RPath

	/** The Async Code to run when the Socket gets an Upgrade HTTP Request */ onUpgrade?(ctr: MergeObjects<[ HTTPRequest<Context, '', Path>, InstanceType<Middlewares[number]['data']['classModifications']['http']> ]>, end: (...args: any[]) => void): Promise<any> |any
	/** The Async Code to run when the Socket Connects */ onConnect?(ctr: MergeObjects<[ WSConnect<Context, 'connect', Path>, InstanceType<Middlewares[number]['data']['classModifications']['wsConnect']> ]>): RealAny
	/** The Async Code to run when the Socket recieves a Message */ onMessage?(ctr: MergeObjects<[ WSMessage<Context, Message, Path>, InstanceType<Middlewares[number]['data']['classModifications']['wsMessage']> ]>): RealAny
	/** The Async Code to run when the Socket Closes */ onClose?(ctr: MergeObjects<[ WSClose<Context, Message, Path>, InstanceType<Middlewares[number]['data']['classModifications']['wsClose']> ]>): RealAny

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



export type WebSocketContext = {
	/** The Request Context Object from the Upgrade Event */ ctx: LocalContext
	/** The Custom Variables around the Socket */ custom: any
}