import { GlobalContext, RequestContext } from "../interfaces/context";
import { Events } from "../interfaces/event";
import { HTTPRequestContext } from "../interfaces/external";
export default function handleEvent(event: Events, ctr: HTTPRequestContext, ctx: RequestContext, ctg: GlobalContext, error?: Error): Promise<boolean>;
