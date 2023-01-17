/// <reference types="node" />
/// <reference types="node" />
import { Server, IncomingMessage, ServerResponse } from "http";
import { UrlWithStringQuery } from "url";
import { types } from "./types";
interface printOptions {
    /**
     * Whether to Format the Outgoing JSON
     * @default false
    */ niceJSON?: boolean;
}
export default interface ctr<Custom = {}, HasError = false> {
    /** A Map of all Headers */ readonly header: Map<Lowercase<string>, string>;
    /** A Map of all Cookies */ readonly cookie: Map<string, string>;
    /** A Map of all Parameters */ readonly param: Map<string, string>;
    /** A Map of all Queries */ readonly query: Map<string, string>;
    /** The Port that the Client is using */ readonly hostPort: number;
    /** The Ip that the Client is using */ readonly hostIp: string;
    /** The Request Body (JSON Automatically parsed) */ readonly reqBody: any;
    /** The Requested URL */ readonly reqUrl: UrlWithStringQuery & {
        method: Uppercase<types>;
    };
    /** The Raw HTTP Server Variable */ rawServer: Server;
    /** The Raw HTTP Server Req Variable */ rawReq: IncomingMessage;
    /** The Raw HTTP Server Res Variable */ rawRes: ServerResponse;
    /** The Error from the Request */ error?: HasError extends true ? Error : undefined;
    /** Set an HTTP Header to add */ setHeader: (name: string, value: string) => ctr;
    /** Set a Custom Variable */ setCustom: <Type extends keyof Custom>(name: Type, value: Custom[Type]) => ctr;
    /** Print a Message to the Client (automatically Formatted) */ print: (msg: any, options?: printOptions) => ctr;
    /** The Request Status to Send */ status: (code: number) => ctr;
    /** Print the Content of a File to the Client */ printFile: (path: string) => ctr;
    /** Custom Variables that are Global */ '@': Custom;
}
export {};
