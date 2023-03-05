/// <reference types="node" />
/// <reference types="node" />
import { GlobalContext } from "../../interfaces/context";
import { IncomingMessage, ServerResponse } from "http";
import { Http2ServerRequest, Http2ServerResponse } from "http2";
export declare const getPreviousHours: () => number[];
export default function handleHTTPRequest(req: IncomingMessage | Http2ServerRequest, res: ServerResponse | Http2ServerResponse, ctg: GlobalContext): Promise<void>;
