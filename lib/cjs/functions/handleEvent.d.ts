import { GlobalContext, RequestContext } from "../interfaces/context";
import { Events } from "../interfaces/event";
import Ctr from "../interfaces/ctr";
export default function handleEvent(event: Events, ctr: Ctr, ctx: RequestContext, ctg: GlobalContext): Promise<boolean>;
