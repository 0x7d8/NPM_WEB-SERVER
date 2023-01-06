import ctr from "./interfaces/ctr";
import routeList from "./classes/routeList";
import page from "./interfaces/page";
interface rateLimitRule {
    /** The Path of the Rule */ path: string;
    /** How often a User can request */ times: number;
    /** How Long a Request stays counted */ timeout: number;
}
interface startOptions {
    pages?: {
        /** When a Route is not found */ notFound?: (ctr: ctr) => Promise<void>;
        /** When an Error occurs in a Route */ reqError?: (ctr: ctr) => Promise<void>;
    };
    events?: {
        /** On Every Request */ request?: (ctr: ctr) => Promise<void>;
    };
    urls?: {
        list: () => page[];
    };
    rateLimits?: {
        /** If true Ratelimits are enabled */ enabled: boolean;
        /** The Message that gets sent when a ratelimit maxes out */ message?: any;
        /** The List of Ratelimit Rules */ list: rateLimitRule[];
        /** The RateLimit Functions */ functions: {
            set: (key: string, value: any) => Promise<any>;
            get: (key: string) => Promise<any>;
            del: (key: string) => Promise<any>;
        };
    };
    /** Where the Server should bind to */ bind?: string;
    /** If true x-real-ip will be shown as hostIp */ proxy?: boolean;
    /** If true all cors headers are set */ cors?: boolean;
    /** Where the Server should start at */ port?: number;
    /** The Maximum Body Size in MB */ body?: number;
}
declare const _default: {
    RouteList: {
        new (): routeList;
    };
    routeList: {
        new (): routeList;
    };
    types: {
        options: string;
        delete: string;
        patch: string;
        post: string;
        put: string;
        get: string;
    };
    start(options: startOptions): Promise<{
        success: boolean;
        port: number;
        message: string;
    }>;
};
export = _default;
//# sourceMappingURL=index.d.ts.map