import { HTTPMethods } from "./internal"
export { Options } from "../functions/parseOptions"
export { default as HTMLBuilder, HTMLAttribute, HTMLContent } from "../classes/HTMLBuilder"

type UnionToIntersection<U>
	= (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never

export type MiddlewareToProps<T extends object[]>
	= T extends (infer U)[] ? Record<keyof U, UnionToIntersection<U[keyof U]>> : never

export * from "./webSocket"
export { HTTPRequestContext } from "./http"

export { HTTPMethods }

export { default as Status } from "../misc/statusEnum"
export { default as Methods } from "../misc/methodsEnum"
export { MiddlewareProduction } from "../classes/middlewareBuilder"