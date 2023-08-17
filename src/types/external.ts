import { HTTPMethod } from "./internal"
export { Options } from "../functions/parseOptions"
export { default as HTMLBuilder, HTMLAttribute, HTMLContent } from "../classes/HTMLBuilder"
import { MultipartField } from "@rjweb/uws"
export { default as HTMLComponent } from "../classes/HTMLComponent"

export * as utils from "rjutils-collection"
export * from "./webSocket"

import HttpRequest from "../classes/web/HttpRequest"
import WsConnect from "../classes/web/WsConnect"
import WsMessage from "../classes/web/WsMessage"
import WsClose from "../classes/web/WsClose"

export type JSONParsed = Record<string, string | number | boolean | JSONParsed[]>
export type URLEncodedParsed = Record<string, string>
export type MultiPartParsed = MultipartField[]

export type RatelimitInfos = {
	/**
	 * The Number of hits the client made in the current time window
	 * @since 8.6.0
	*/ hits: number
	/**
	 * The Maximum number of hits the client is allowed to make in the specified time window
	 * @since 8.6.0
	*/ maxHits: number
	/**
	 * Whether the client has recieved the penalty
	 * @since 8.6.0
	*/ hasPenalty: boolean
	/**
	 * The Number of milliseconds penalty the client recieves
	 * @since 8.6.0
	*/ penalty: number
	/**
	 * The Number of milliseconds a time window is long
	 * @since 8.6.0
	*/ timeWindow: number
	/**
	 * The Date when the time Window (+ penalty) is over
	 * @since 8.6.0
	*/ endsAt: Date
	/**
	 * The Number of milliseconds until the time Window (+ penalty) is over
	 * @since 8.6.0
	*/ endsIn: number
}

export type RequestContext = HttpRequest | WsConnect | WsMessage | WsClose

export {
	HttpRequest,
	WsConnect,
	WsMessage,
	WsClose
}

export { HTTPMethod }

export { default as Status } from "../misc/statusEnum"
export { default as Methods } from "../misc/methodsEnum"