/// <reference types="node" />
/// <reference types="node" />
import { Server, IncomingMessage, ServerResponse } from "http";
import valueCollection from "../classes/valueCollection";
import { UrlWithStringQuery } from "url";
import { types } from "./methods";
interface printOptions {
    /**
     * Whether to Format the Outgoing JSON (If any)
     * @default false
    */ niceJSON?: boolean;
    /**
     * The Content Type to use
     * @default ''
    */ contentType?: string;
    /**
     * Whether to evaluate returned Function (If Function was sent)
     * @default false
    */ returnFunctions?: boolean;
}
interface printFileOptions {
    /**
     * Whether some Content Type Headers will be added automatically
     * @default true
    */ addTypes?: boolean;
    /**
     * The Content Type to use
     * @default ''
    */ contentType?: string;
    /**
     * Whether to Cache the sent Files after accessed once (only renew after restart)
     * @default false
    */ cache?: boolean;
}
export default interface ctr<Custom = any, HasError = false, Body = any> {
    /** A Collection of all Headers */ readonly headers: valueCollection<Lowercase<string>, string>;
    /** A Collection of all Cookies */ readonly cookies: valueCollection<string, string>;
    /** A Collection of all Parameters */ readonly params: valueCollection<string, string>;
    /** A Collection of all Queries */ readonly queries: valueCollection<string, string>;
    /** Client Infos */ readonly client: {
        /** The User Agent of the Client */ readonly userAgent: string;
        /** The HTTP Version that the Client is using */ readonly httpVersion: string;
        /** The Port that the Client is using */ readonly port: number;
        /** The Ip that the Client is using */ readonly ip: string;
    };
    /** The Request Body (JSON Automatically parsed) */ readonly body: Body;
    /** The Requested URL */ readonly url: UrlWithStringQuery & {
        method: Uppercase<types>;
    };
    /** The Raw HTTP Server Variable */ rawServer: Server;
    /** The Raw HTTP Server Req Variable */ rawReq: IncomingMessage;
    /** The Raw HTTP Server Res Variable */ rawRes: ServerResponse;
    /** The Error from the Request */ error?: HasError extends true ? Error : undefined;
    /** Set an HTTP Header to add */ setHeader: (name: string, value: string | number) => ctr;
    /** Set a Custom Variable */ setCustom: <Type extends keyof Custom>(name: Type, value: Custom[Type]) => ctr;
    /** The Request Status to Send */ status: (code: number) => ctr;
    /** Redirect a Client to another Location */ redirect: (location: string, statusCode?: 301 | 302) => ctr;
    /** Print a Message to the Client (automatically Formatted) */ print: (msg: any, options?: printOptions) => ctr;
    /** Print the Content of a File to the Client */ printFile: (path: string, options?: printFileOptions) => ctr;
    /** Custom Variables that are Global */ '@': Custom;
}
export {};
