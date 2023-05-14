import { HTTPMethods } from "./internal"
export { Options } from "../functions/parseOptions"
export { default as HTMLBuilder, HTMLAttribute, HTMLContent } from "../classes/HTMLBuilder"
export { default as HTMLComponent } from "../classes/HTMLComponent"

export * from "./webSocket"

import HttpRequest from "../classes/web/HttpRequest"
import WsConnect from "../classes/web/WsConnect"
import WsMessage from "../classes/web/WsMessage"
import WsClose from "../classes/web/WsClose"

export type RequestContext = HttpRequest | WsConnect | WsMessage | WsClose

export {
	HttpRequest,
	WsConnect,
	WsMessage,
	WsClose
}

export { HTTPMethods }

export { default as Status } from "../misc/statusEnum"
export { default as Methods } from "../misc/methodsEnum"