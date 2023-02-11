import { GlobalContext, RequestContext } from "../interfaces/context";
import { Options } from "../classes/serverOptions";
import ctr from "../interfaces/ctr";
export default function statsRoute(ctr: ctr, ctg: GlobalContext, ctx: RequestContext, options: Options, routes: number): Promise<ctr<any, false, any>>;
