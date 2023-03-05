/// <reference types="node" />
import { GlobalContext } from "../../interfaces/context";
import { IncomingMessage, ServerResponse } from "http";
export declare const getPreviousHours: () => number[];
export default function handleHTTPRequest(req: IncomingMessage, res: ServerResponse, ctg: GlobalContext): Promise<void>;
