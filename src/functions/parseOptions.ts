import { Content } from "./parseContent"
import { CompressTypes } from "./handleCompressType"
import { DeepRequired } from "../types/internal"
import { deepParseOptions } from "rjutils-collection"

export type Options = {
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
		 * The Maximum Size of the HTTP Body / WS Message in MB
		 * @default 5
		 * @since 2.6.0
		*/ maxSize?: number
		/**
		 * The Message that gets sent when the HTTP Body Size is exceeded
		 * @default "Payload too large"
		 * @since 2.7.1
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
	 * Where the Server should bind to
	 * @default "0.0.0.0"
	 * @since 0.0.4
	*/ bind?: string
	/**
	 * Whether X-Forwarded-For will be shown as hostIp
	 * @default false
	 * @since 0.6.5
	*/ proxy?: boolean
	/**
	 * The Method to use to compress data
	 * @default "none"
	 * @since 3.0.0
	*/ compression?: CompressTypes
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
	 * Whether the rjweb-server Header will be added
	 * @default true
	 * @since 2.0.0
	*/ poweredBy?: boolean
}

export default function parseOptions(provided: Options): DeepRequired<Options> {
	return deepParseOptions({
		body: {
			enabled: true,
			maxSize: 5,
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
		}, bind: '0.0.0.0',
		proxy: false,
		compression: 'none',
		cors: false,
		port: 0,
		cache: true,
		poweredBy: true
	}, provided)
}