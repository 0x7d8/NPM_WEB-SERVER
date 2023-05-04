export { default as Server } from "./classes/webServer"
export { default as ValueCollection } from "./classes/valueCollection"
export { default as MiddlewareBuilder } from "./classes/middlewareBuilder"
export { default as URLObject } from "./classes/URLObject"
export { default as parseContent, Content } from "./functions/parseContent"
export { default as parseStatus } from "./functions/parseStatus"
export { default as Reference } from "./classes/reference"

/** @ts-ignore */
import { version } from "./pckg.json"
export const Version: string = version
export { currentVersion as MiddlewareVersion } from "./classes/middlewareBuilder"

/** Interfaces */
export * from "./types/external"