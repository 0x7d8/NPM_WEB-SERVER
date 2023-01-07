import typesInterface from "../interfaces/types";
import ctr from "./ctr";
export default interface page {
    array: string[];
    path: string;
    type: typesInterface;
    addTypes: boolean;
    code: (ctr: ctr) => any;
    content?: any;
}
//# sourceMappingURL=page.d.ts.map