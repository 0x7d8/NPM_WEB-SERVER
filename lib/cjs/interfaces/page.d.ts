/// <reference types="node" />
import { types } from "./types";
import ctr from "./ctr";
export default interface page {
    /** An Array of the URL split by Slashes */ array: string[];
    /** The URL as normal String */ path: string;
    /** The HTTP Request Type */ type: types;
    /** Whether then some Content Types will be added automatically */ addTypes: boolean;
    /** The Async Code to run on a Request */ code: (ctr: ctr) => Promise<any>;
    /** The File Content (If Preloading) */ content?: Buffer;
}