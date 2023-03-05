import ctr from "./ctr";
export default interface Static {
    /** The URL as normal String */ path: string;
    /** The Location of the Folder */ location: string;
    /** Additional Route Data */ data: {
        /** Whether then some Content Types will be added automatically */ addTypes: boolean;
        /** Whether to automatically remove .html endings from files */ hideHTML: boolean;
        /** The Auth Checks to run on this route */ authChecks: ((ctr: ctr) => Promise<any> | any)[];
    };
}
