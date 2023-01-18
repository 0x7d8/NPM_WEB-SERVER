/// <reference types="node" />
import routeList from "./classes/routeList";
import rateLimitRule from "./interfaces/ratelimitRule";
import typesEnum from "./interfaces/types";
import * as http from "http";
interface startOptions {
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
        /** The RateLimit Functions */ functions: {
            set: (key: string, value: number) => Promise<any>;
            get: (key: string) => Promise<number>;
        } | Map<string, number>;
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
     * @default 20
    */ maxBody?: number;
    /**
     * Add X-Powered-By Header
     * @default true
    */ poweredBy?: boolean;
}
declare const _default: {
    /** The RouteList */
    routeList: typeof routeList;
    /** The Request Types */
    types: typeof typesEnum;
    /** Start The Webserver */
    start(options: startOptions): Promise<{
        success: boolean;
        port?: number;
        error?: Error;
        message: string;
        rawServer?: http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>;
    }>;
};
export = _default;
