/// <reference types="node" />
import { Types } from "./methods";
import ctr from "./ctr";
export default interface Route {
    /** The Request Method of the Route */ method: Types;
    /** The URL as normal String */ path: string;
    /** An Array of the URL split by Slashes */ pathArray: string[];
    /** The Async Code to run on the Request */ code: (ctr: ctr) => Promise<any>;
    /** Additional Route Data */ data: {
        /** Whether then some Content Types will be added automatically */ addTypes: boolean;
        /** The File Content (If Preloading) */ content?: Buffer;
        /** The File Path (If Static) */ file?: string;
    };
}
