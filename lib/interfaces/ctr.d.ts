/// <reference types="node" />
/// <reference types="node" />
import { IncomingMessage, ServerResponse } from "http";
import { UrlWithStringQuery } from "url";
export default interface ctr {
    /** A Map of all Headers */ header: Map<any, any>;
    /** A Map of all Cookies */ cookie: Map<any, any>;
    /** A Map of all Parameters */ param: Map<any, any>;
    /** A Map of all Queries */ query: Map<any, any>;
    /** The Port that the Client is using */ hostPort: number;
    /** The Ip that the Client is using */ hostIp: string;
    /** The Request Body (JSON Automatically parsed) */ reqBody: any;
    /** The Requested URL */ reqUrl: UrlWithStringQuery & {
        method: string;
    };
    /** The Raw HTTP Server Req Variable */ rawReq: IncomingMessage;
    /** The Raw HTTP Server Res Variable */ rawRes: ServerResponse;
    /** The Error (If in the error event) */ error?: Error;
    /** Set an HTTP Header to add */ setHeader: (name: string, value: string) => ctr;
    /** Print a Message to the Client */ print: (msg: any) => ctr;
    /** The Request Status to Send */ status: (code: number) => ctr;
    /** Print the Content of a File to the Client */ printFile: (path: string) => ctr;
}
//# sourceMappingURL=ctr.d.ts.map