import { GlobalContext, RequestContext } from "../interfaces/context";
import { Events } from "../interfaces/internal";
import { HTTPRequestContext } from "../interfaces/external";
export default function handleEvent(event: Events, ctr: HTTPRequestContext, ctx: RequestContext, ctg: GlobalContext): Promise<boolean>;
