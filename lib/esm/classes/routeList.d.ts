import { types as typesInterface } from "../interfaces/methods";
import route from "../interfaces/route";
import event, { events as eventsType } from "../interfaces/event";
import ctr from "../interfaces/ctr";
export declare const pathParser: (path: string) => string;
interface staticOptions {
    /**
     * Whether the files will be loaded into Memory
     * @default false
    */ preload?: boolean;
    /**
     * Whether .html & .htm endings will be removed automatically
     * @default false
    */ remHTML?: boolean;
    /**
     * Whether some Content Type Headers will be added automatically
     * @default true
    */ addTypes?: boolean;
}
export default class routeList {
    private routes;
    private events;
    /** List of Routes */
    constructor(
    /**
     * Routes to Import
     * @default []
     */ routes?: route[], 
    /**
     * Events to Import
     * @default []
     */ events?: event[]);
    /** Set An Event Manually */
    event(
    /** The Event Name */ event: eventsType, 
    /** The Async Code to run on a Request */ code: (ctr: ctr) => Promise<any>): number | false;
    /** Set A Route Manually */
    set(
    /** The Request Method */ method: typesInterface, 
    /** The Path on which this will be available */ urlPath: string, 
    /** The Async Code to run on a Request */ code: (ctr: ctr) => Promise<any>): number | false;
    /** Serve Static Files */
    static(
    /** The Path to serve the Files on */ urlPath: string, 
    /** The Location of the Folder to load from */ folder: string, 
    /** Additional Options */ options?: staticOptions): number[];
    /** Load External Function Files */
    load(
    /** The Location of the Folder to load from */ folder: string): number[];
    /** Internal Function to access all Routes & Events as Array */
    list(): {
        routes: route[];
        events: event[];
    };
}
export {};
