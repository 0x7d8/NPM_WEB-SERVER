import { Routed } from "./internal";
export default interface Static {
    /** The Type of this Object */ type: 'static';
    /** The URL as normal String */ path: string;
    /** The Location of the Folder */ location: string;
    /** Additional Route Data */ data: {
        /** Whether then some Content Types will be added automatically */ addTypes: boolean;
        /** Whether to automatically remove .html endings from files */ hideHTML: boolean;
        /** The Validations to run on this route */ validations: Routed[];
    };
}
