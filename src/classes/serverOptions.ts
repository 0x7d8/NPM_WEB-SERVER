import { Content } from "../functions/parseContent"
import { CompressTypes } from "../functions/handleCompressType"
import { DeepRequired } from "../types/internal"

export interface Options {
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
		 * Whether to try parsing the HTTP Body / WS Message as JSON
		 * @default true
		 * @since 2.7.3
		*/ parse?: boolean
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
	 * Where the Server should start at
	 * @default 2023
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

export default class ServerOptions {
	private data: DeepRequired<Options>

	/** Server Options Helper */
	constructor(options: Options) {
		this.data = this.mergeOptions({
			body: {
				enabled: true,
				parse: true,
				maxSize: 5,
				message: 'Payload too large'
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
				password: ''
			}, bind: '0.0.0.0',
			proxy: false,
			compression: 'none',
			cors: false,
			port: 2023,
			cache: true,
			poweredBy: true
		}, options)
	}

	private mergeOptions(original: Options, user: Options): DeepRequired<Options> {
		const handleObject = (original: Record<string, any>, user: Record<string, any>) => {
			let output: Record<string, any> = {}
			Object.keys(original).forEach((key) => {
				if (typeof original[key] === 'object' && key in user) output[key] = handleObject(original[key], user[key])
				else if (typeof original[key] === 'object') output[key] = original[key]
				else if (key in user) output[key] = user[key]
				else output[key] = original[key]
			})

			return output
		}

		return handleObject(original, user) as any
	}

	/** Get the Resulting Options */
	getOptions() {
		return this.data
	}
}