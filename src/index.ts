import { version as packageVersion } from "package.json"
export const version: string = packageVersion

export { Implementation } from "@/types/implementation"
export { HttpContext as ImplementationHttpContext } from "@/types/implementation/contexts/http"
export { WsContext as ImplementationWsContext } from "@/types/implementation/contexts/ws"
export { HandleRecord as ImplementationHandleRecord, WebsocketData as ImplementationWebsocketData } from "@/types/implementation/handle"
export { default as GlobalContext } from "@/types/internal/classes/GlobalContext"
export { default as RequestContext } from "@/types/internal/classes/RequestContext"

export { default as HttpRequestContext } from "@/classes/request/HttpRequestContext"
export { default as WsOpenContext } from "@/classes/request/WsOpenContext"
export { default as WsMessageContext } from "@/classes/request/WsMessageContext"
export { default as WsCloseContext } from "@/classes/request/WsCloseContext"
export type { FullServerOptions, ServerOptions } from "@/types/structures/ServerOptions"

export * from "@/types/global"
export * from "@/middlewares"

import parseContent from "@/functions/parseContent"
import parseURL from "@/functions/parseURL"
import parseKV from "@/functions/parseKV"
import writeHeaders from "@/functions/writeHeaders"
import html, { HTMLContent } from "@/functions/html"

import Server, { defaultOptions } from "@/classes/Server"
import ValueCollection from "@/classes/ValueCollection"
import Channel from "@/classes/Channel"
import Cookie from "@/classes/Cookie"
import Throttler from "@/classes/Throttler"
import Middleware from "@/classes/Middleware"
import RuntimeError from "@/classes/RuntimeError"

export {
	parseContent,
	parseURL,
	parseKV,
	writeHeaders,
	html,

	defaultOptions,

	Server,
	ValueCollection,
	Channel,
	Cookie,
	Throttler,
	Middleware,
	RuntimeError
}

export type {
	HTMLContent
}