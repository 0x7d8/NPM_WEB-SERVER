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

export { type Content, ParseStream } from "@/functions/parseContent"