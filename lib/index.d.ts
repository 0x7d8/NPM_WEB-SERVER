import ctr, { ctrError } from "./interfaces/ctr";
import routeList from "./classes/routeList";
import rateLimitRule from "./interfaces/ratelimitRule";
import typesEnum from "./interfaces/types";
import page from "./interfaces/page";
interface startOptions {
    pages?: {
        /** When a Route is not found */ notFound?: (ctr: ctr) => Promise<any>;
        /** When an Error occurs in a Route */ reqError?: (ctr: ctrError) => Promise<any>;
    };
    events?: {
        /** On Every Request */ request?: (ctr: ctr) => Promise<any>;
    };
    urls?: {
        list: () => page[];
    };
    rateLimits?: {
        /**
         * If true Ratelimits are enabled
         * @default false
        */ enabled: boolean;
        /**
         * The Message that gets sent when a ratelimit maxes out
         * @default "Rate Limited"
        */ message?: any;
        /**
         * The List of Ratelimit Rules
         * @default []
        */ list: rateLimitRule[];
        /** The RateLimit Functions */ functions: {
            set: (key: string, value: number) => Promise<any>;
            get: (key: string) => Promise<any>;
        } | Map<any, any>;
    };
    /**
     * Where the Server should bind to
     * @default "0.0.0.0"
    */ bind?: string;
    /**
     * If true X-Forwarded-For will be shown as hostIp
     * @default false
    */ proxy?: boolean;
    /**
     * If true all cors headers are set
     * @default false
    */ cors?: boolean;
    /**
     * Where the Server should start at
     * @default 5002
    */ port?: number;
    /**
     * The Maximum Body Size in MB
     * @default 20
    */ body?: number;
}
declare const _default: {
    routeList: typeof routeList;
    types: typeof typesEnum;
    start(options: startOptions): Promise<unknown>;
};
export = _default;
//# sourceMappingURL=index.d.ts.map