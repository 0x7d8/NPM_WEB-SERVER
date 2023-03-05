import { GlobalContext, RequestContext } from "../interfaces/context";
import ctr from "../interfaces/ctr";
export default function statsRoute(ctr: ctr, ctg: GlobalContext, ctx: RequestContext, routes: number): Promise<ctr<any, false, any>>;
