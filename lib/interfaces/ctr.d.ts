/// <reference types="node" />
import { UrlWithStringQuery } from "url";
declare const map: Map<any, any>;
export default interface ctr {
    header: typeof map;
    cookie: typeof map;
    param: typeof map;
    query: typeof map;
    hostPort: number;
    hostIp: string;
    reqBody?: string | {
        [key: string]: any;
    };
    reqUrl: UrlWithStringQuery;
    rawReq: any;
    rawRes: any;
    error?: Error;
    setHeader: (name: string, value: string) => ctr;
    print: (msg: any) => ctr;
    status: (code: number) => ctr;
    printFile: (path: string) => ctr;
}
export {};
//# sourceMappingURL=ctr.d.ts.map