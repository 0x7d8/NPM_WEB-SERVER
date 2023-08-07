export { default as Server } from "./classes/server"
export { default as ValueCollection } from "./classes/valueCollection"
export { default as MiddlewareBuilder } from "./classes/middlewareBuilder"
export { default as URLObject } from "./classes/URLObject"
export { default as parseContent, Content, ParseStream } from "./functions/parseContent"
export { default as parseContentType } from "./functions/parseContentType"
export { default as parseStatus } from "./functions/parseStatus"
export { default as parsePath } from "./functions/parsePath"
export { default as parseKV } from "./functions/parseKV"
export { default as Reference } from "./classes/reference"
export { default as size } from "./functions/size"
export { default as html } from "./functions/html"

/** @ts-ignore */
import { version } from "./pckg.json"
export const Version: string = version
export { currentVersion as MiddlewareVersion } from "./classes/middlewareBuilder"

/** Interfaces */
export * from "./types/external"