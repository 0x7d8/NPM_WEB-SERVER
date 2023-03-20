import { CompressTypes } from "../functions/handleCompressType";
export interface Options {
    /** HTTP Body Settings */ body?: {
        /**
         * Whether recieving HTTP Bodies is enabled
         * @default true
        */ enabled?: boolean;
        /**
         * Whether to try parsing the HTTP Body as JSON
         * @default true
        */ parse?: boolean;
        /**
         * The Maximum Size of the HTTP Body in MB
         * @default 5
        */ maxSize?: number;
        /**
         * The Message that gets sent when the HTTP Body Size is exceeded
         * @default "Payload too large"
        */ message?: any;
    };
    /** HTTPS Settings */ https?: {
        /**
         * Whether HTTPS is enabled
         * @default false
        */ enabled?: boolean;
        /**
         * The Key File Path
         * @default "/ssl/key/path"
        */ keyFile?: string;
        /**
         * The Cert File Path
         * @default "/ssl/cert/path"
        */ certFile?: string;
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
    /** Header Settings */ headers?: {
        [key: string]: string | number;
    };
    /** Content-Type Settings */ contentTypes?: {
        [fileEnding: string]: string;
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
     * The Method to use to compress data
     * @default "none"
    */ compression?: CompressTypes;
    /**
     * Whether all cors Headers will be set
     * @default false
    */ cors?: boolean;
    /**
     * Where the Server should start at
     * @default 2023
    */ port?: number;
    /**
     * Add X-Powered-By Header
     * @default true
    */ poweredBy?: boolean;
}
export default class ServerOptions {
    private data;
    /** Server Options Helper */
    constructor(options: Partial<Options>);
    private mergeOptions;
    /** Get the Resulting Options */
    getOptions(): Options;
}
