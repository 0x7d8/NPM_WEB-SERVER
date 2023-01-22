import rateLimitRule from "../interfaces/ratelimitRule";
import routeList from "./routeList";
export interface Options {
    /** The Routes for the Server */ routes: routeList;
    /** RateLimit Settings */ rateLimits?: {
        /**
         * Whether Ratelimits are enabled
         * @default false
        */ enabled?: boolean;
        /**
         * The Message that gets sent when a ratelimit maxes out
         * @default "Rate Limited"
        */ message?: any;
        /**
         * The List of Ratelimit Rules
         * @default []
        */ list?: rateLimitRule[];
        /**
     * The RateLimit Functions
     * @default Map
     */ functions?: {
            set: (key: string, value: number) => Promise<any>;
            get: (key: string) => Promise<number>;
        } | Map<string, number>;
    };
    /** Dashboard Settings */ dashboard?: {
        /**
         * Whether the Dashboard is enabled
         * @default false
        */ enabled?: boolean;
        /**
         * The Path to access the Dashboard on
         * @default "/rjweb-dashboard"
        */ path?: string;
    };
    /**
     * Where the Server should bind to
     * @default "0.0.0.0"
    */ bind?: string;
    /**
     * Whether X-Forwarded-For will be shown as hostIp
     * @default false
    */ proxy?: boolean;
    /**
     * Whether all cors headers are set
     * @default false
    */ cors?: boolean;
    /**
     * Where the Server should start at
     * @default 2023
    */ port?: number;
    /**
     * The Maximum Body Size in MB
     * @default 5
    */ maxBody?: number;
    /**
     * Add X-Powered-By Header
     * @default true
    */ poweredBy?: boolean;
}
export default class serverOptions {
    private data;
    /** Server Options Helper */
    constructor(options: Options);
    private mergeOptions;
    /** Get the Resulting Options */
    getOptions(): Options;
}
