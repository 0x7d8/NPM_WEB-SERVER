import { HTTPMethods } from "./general";
import Ctr from "./ctr";
export default interface CtrFile<Custom = any, Body = any> {
    /** The Request Method */ method: HTTPMethods;
    /** The Route Path */ path: string;
    /** The Async Code to run on a Request */ code: (ctr: Ctr<Custom, false, Body>) => Promise<any> | any;
}
