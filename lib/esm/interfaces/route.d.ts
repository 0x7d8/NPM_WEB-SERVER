import { HTTPMethods, Routed } from "./internal";
export default interface Route {
    /** The Type of this Object */ type: 'route';
    /** The Request Method of the Route */ method: HTTPMethods;
    /** The URL as normal String */ path: string;
    /** An Array of the URL split by Slashes */ pathArray: string[];
    /** The Async Code to run on the Request */ code: Routed;
    /** Additional Route Data */ data: {
        /** The Validations to run on this route */ validations: Routed[];
    };
}
