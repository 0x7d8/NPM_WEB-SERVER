import { Content } from "./parseContent"
import { CompressTypes } from "./handleCompressType"
import { DeepRequired } from "../types/internal"
import { deepParseOptions } from "rjutils-collection"
import size from "./size"

export type Options = {
	/**
	 * HTTP Compression Settings
	 * @since 7.10.0
	*/ httpCompression?: {
		/**
		 * Whether http body compression is enabled
		 * @default true
		 * @since 7.10.0
		*/ enabled?: boolean
		/**
		 * The Maximum Size of bodies to compress
		 * @default size(100).mb()
		 * @since 7.10.0
		*/ maxSize?: number
		/**
		 * Disabled compression algorithms
		 * @default []
		 * @since 7.10.0
		*/ disabledAlgorithms?: Exclude<CompressTypes, 'none'>[]
	}

	/**
	 * WebSocket Compression Settings
	 * @since 7.10.0
	*/ wsCompression?: {
		/**
		 * Whether http body compression is enabled
		 * @default true
		 * @since 7.10.0
		*/ enabled?: boolean
	}

	/**
	 * HTTP Body Settings
	 * @since 2.6.0
	*/ body?: {
		/**
		 * Whether recieving HTTP Bodies is enabled
		 * @default true
		 * @since 2.6.0
		*/ enabled?: boolean
		/**
		 * The Maximum Size of the HTTP Body
		 * @default size(5).mb()
		 * @since 2.6.0
		*/ maxSize?: number
		/**
		 * The Message that gets sent when the HTTP Body Size is exceeded
		 * @default "Payload too large"
		 * @since 2.7.1
		*/ message?: Content
	}

	/**
	 * WebSocket Message Settings
	 * @since 7.10.0
	*/ message?: {
		/**
		 * Whether recieving WebSocket Messages is enabled
		 * @default true
		 * @since 7.10.0
		*/ enabled?: boolean
		/**
		 * The Maximum Size of the WebSocket Message
		 * @default size(500).kb()
		 * @since 7.10.0
		*/ maxSize?: number
		/**
		 * The Message that gets sent when the WebSocket Message Size is exceeded
		 * @default "Payload too large"
		 * @since 7.10.0
		*/ message?: Content
	}

	/**
	 * Logging Settings
	 * @since 7.4.0
	*/ logging?: {
		/**
		 * Whether to enable `ERROR` Logs
		 * @default true
		 * @since 7.4.0
		*/ error?: boolean
		/**
		 * Whether to enable `WARN` Logs
		 * @default true
		 * @since 7.4.0
		*/ warn?: boolean
		/**
		 * Whether to enable `DEBUG` Logs
		 * @default false
		 * @since 7.4.0
		*/ debug?: boolean
	}

	/**
	 * SSL Settings
	 * @since 6.0.0
	*/ ssl?: {
		/**
		 * Whether SSL is enabled
		 * @default false
		 * @since 6.0.0
		*/ enabled?: boolean
		/**
		 * The Ciphers to use
		 * @default "ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384"
		 * @since 6.0.0
		*/ ciphers?: string
		/**
		 * The Key File Path
		 * @default "/ssl/key/path"
		 * @since 6.0.0
		*/ keyFile?: string
		/**
		 * The Cert File Path
		 * @default "/ssl/cert/path"
		 * @since 6.0.0
		*/ certFile?: string
		/**
		 * The Ca File Path
		 * @default ""
		 * @since 6.0.0
		*/ caFile?: string
		/**
		 * The Dhparam File Path
		 * @default ""
		 * @since 6.0.0
		*/ dhParamFile?: string
	}

	/**
	 * Dashboard Settings 
	 * @since 2.4.0
	*/ dashboard?: {
		/**
		 * Whether the Dashboard is enabled
		 * @default false
		 * @since 2.4.0
		*/ enabled?: boolean
		/**
		 * The Path to access the Dashboard on
		 * @default "/rjweb-dashboard"
		 * @since 2.4.0
		*/ path?: string
		/**
		 * The Password to access the Dashboard with
		 * @default ""
		 * @since 5.8.0
		*/ password?: string
		/**
		 * The Interval in which to update Data in the Dashboard (in milliseconds)
		 * @default 1500
		 * @since 6.3.0
		*/ updateInterval?: number
	}

	/**
	 * General Performance Settings
	 * @since 6.3.0
	*/ performance?: {
		/**
		 * Whether to include ETag Headers on every request with a direct Body
		 * @default true
		 * @since 6.3.0
		*/ eTag?: boolean
		/**
		 * Whether to include Last-Modified Headers on every request that serves a file
		 * @default true
		 * @since 6.3.0
		*/ lastModified?: boolean
		/**
		 * Whether to decompress http bodies
		 * @default true
		 * @since 6.3.0
		*/ decompressBodies?: boolean
	}

	/**
	 * HTTP Proxy Options
	 * @since 8.0.0
	*/ proxy?: {
		/**
		 * Whether to check for proxies and use alternate IPs
		 * @default false
		 * @since 8.0.0
		*/ enabled?: boolean
		/**
		 * Whether to force all requests through the proxy
		 * @default false
		 * @since 8.0.0
		*/ forceProxy?: boolean
		/**
		 * The Header to use for getting the actual IP address
		 * @default "X-Forwarded-For"
		 * @since 8.0.0
		*/ header?: string

		/**
		 * The Credentials that the proxy will use
		 * @since 8.0.0
		*/ credentials?: {
			/**
			 * Whether to authenticate proxy requests
			 * @default true
			 * @since 8.0.0
			*/ authenticate?: boolean
			/**
			 * The Username required to authenticate
			 * @default "proxy"
			 * @since 8.0.0
			*/ username?: string
			/**
			 * The Password required to authenticate
			 * @default "proxy"
			 * @since 8.0.0
			*/ password?: string
		}
	}

	/**
	 * Where the Server should bind to
	 * @default "0.0.0.0"
	 * @since 0.0.4
	*/ bind?: string
	/**
	 * Whether all cors Headers will be set
	 * @default false
	 * @since 0.1.0
	*/ cors?: boolean
	/**
	 * Where the Server should start at (Port 0 causes automatic selection)
	 * @default 0
	 * @since 0.0.1
	*/ port?: number
	/**
	 * Whether the Cache should be used for Routes, etc
	 * @default true
	 * @since 5.3.1
	*/ cache?: boolean
	/**
	 * How many Cached Items to store before resetting the entire Cache
	 * @default 25000
	 * @since 7.8.4
	*/ cacheLimit?: number
	/**
	 * Whether the rjweb-server Header will be added
	 * @default true
	 * @since 2.0.0
	*/ poweredBy?: boolean
}

/**
 * Parses Provided Server Options into a full Version
 * @since 6.2.0
*/ export default function parseOptions(provided: Options): DeepRequired<Options> {
	return deepParseOptions({
		httpCompression: {
			enabled: true,
			maxSize: size(100).mb(),
			disabledAlgorithms: []
		}, wsCompression: {
			enabled: true
		}, body: {
			enabled: true,
			maxSize: size(5).mb(),
			message: 'Payload too large'
		}, message: {
			enabled: true,
			maxSize: size(500).kb(),
			message: 'Payload too large'
		}, logging: {
			error: true,
			warn: true,
			debug: false
		}, ssl: {
			enabled: false,
			ciphers: 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384',
			keyFile: '/ssl/key/path',
			certFile: '/ssl/cert/path',
			caFile: '',
			dhParamFile: ''
		}, dashboard: {
			enabled: false,
			path: '/rjweb-dashboard',
			password: '',
			updateInterval: 1500
		}, performance: {
			eTag: true,
      lastModified: true,
      decompressBodies: true
		}, proxy: {
			enabled: false,
			header: 'X-Forwarded-For',
			forceProxy: false,
			credentials: {
				authenticate: true,
				username: 'proxy',
				password: 'proxy'
			}
		}, bind: '0.0.0.0',
		cors: false,
		port: 0,
		cache: true,
		cacheLimit: 25000,
		poweredBy: true
	}, provided)
}