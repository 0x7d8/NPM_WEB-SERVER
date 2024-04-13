import method from "@/enums/method"
import status from "@/enums/status"
import reverseProxyIps from "@/enums/reverseProxyIps"

export const Method = method
export type Method = keyof typeof method
export const Status = status
export type Status = keyof typeof status
export const ReverseProxyIps = reverseProxyIps

export type ServerStatus = 'listening' | 'stopped'
export type CompressionAlgorithm = 'gzip' | 'brotli' | 'deflate'

export type ArrayOrNot<T> = T | T[]

export type JSONValue = string | number | boolean | null | undefined | { toString(): string } | { [key: string]: JSONValue } | JSONValue[]
export type JSONParsed = Record<string, JSONValue>
export type URLEncodedParsed = Record<string, string>

export type ParsedBody = JSONParsed | URLEncodedParsed | string

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

export { type Content, ParseStream } from "@/functions/parseContent"