import Ctr from "./ctr"

export type LoadPath = {
  path: string
  prefix: string
  type: 'cjs' | 'esm'
  validations: Routed[]
}

export type HTTPMethods =
  | 'OPTIONS'
  | 'DELETE'
  | 'PATCH'
  | 'POST'
  | 'HEAD'
  | 'PUT'
  | 'GET'

export type ExternalRouter = {
  method: string
  object: unknown
}

export type Routed = (ctr: Ctr) => Promise<any> | any