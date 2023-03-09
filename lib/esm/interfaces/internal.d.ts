import { HTTPRequestContext } from "./external";
export type LoadPath = {
    path: string;
    prefix: string;
    type: 'cjs' | 'esm';
    validations: Routed[];
};
export type Events = 'error' | 'request' | 'notfound';
export type HTTPMethods = 'OPTIONS' | 'DELETE' | 'PATCH' | 'POST' | 'HEAD' | 'PUT' | 'GET';
export type ExternalRouter = {
    method: string;
    object: unknown;
};
export type Routed = (ctr: HTTPRequestContext) => Promise<any> | any;
