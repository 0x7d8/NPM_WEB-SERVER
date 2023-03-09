import { GlobalContext, RequestContext } from "../interfaces/context";
import { HTTPRequestContext } from "../interfaces/external";
export default function statsRoute(ctr: HTTPRequestContext, ctg: GlobalContext, ctx: RequestContext, routes: number): Promise<HTTPRequestContext<{}, any>>;
