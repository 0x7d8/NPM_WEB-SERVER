/// <reference types="node" />
/// <reference types="node" />
import { Server, IncomingMessage, ServerResponse } from "http";
import { UrlWithStringQuery } from "url";
import { types } from "./types";
export default interface ctr {
    /** A Map of all Headers */ readonly header: Map<any, any>;
    /** A Map of all Cookies */ readonly cookie: Map<any, any>;
    /** A Map of all Parameters */ readonly param: Map<any, any>;
    /** A Map of all Queries */ readonly query: Map<any, any>;
    /** The Port that the Client is using */ readonly hostPort: number;
    /** The Ip that the Client is using */ readonly hostIp: string;
    /** The Request Body (JSON Automatically parsed) */ readonly reqBody: any;
    /** The Requested URL */ readonly reqUrl: UrlWithStringQuery & {
        method: types;
    };
    /** The Raw HTTP Server Variable */ rawServer: Server;
    /** The Raw HTTP Server Req Variable */ rawReq: IncomingMessage;
    /** The Raw HTTP Server Res Variable */ rawRes: ServerResponse;
    /** Set an HTTP Header to add */ setHeader: (name: string, value: string) => ctr;
    /** Print a Message to the Client */ print: (msg: any) => ctr;
    /** The Request Status to Send */ status: (code: number) => ctr;
    /** Print the Content of a File to the Client */ printFile: (path: string) => ctr;
}
export interface ctrError extends ctr {
    /** The Error */ error: Error;
}
//# sourceMappingURL=ctr.d.ts.map