import { Content } from "../functions/parseContent"
import { CompressTypes } from "../functions/handleCompressType"
import { DeepRequired } from "../types/internal"

export interface Options {
	/** HTTP Body Settings */ body?: {
		/**
		 * Whether recieving HTTP Bodies is enabled
		 * @default true
		*/ enabled?: boolean
		/**
		 * Whether to try parsing the HTTP Body / WS Message as JSON
		 * @default true
		*/ parse?: boolean
		/**
		 * The Maximum Size of the HTTP Body / WS Message in MB
		 * @default 5
		*/ maxSize?: number
		/**
		 * The Message that gets sent when the HTTP Body Size is exceeded
		 * @default "Payload too large"
		*/ message?: Content
	}

	/** HTTPS Settings */ https?: {
		/**
		 * Whether HTTPS is enabled
		 * @default false
		*/ enabled?: boolean
		/**
		 * The Key File Path
		 * @default "/ssl/key/path"
		*/ keyFile?: string
		/**
		 * The Cert File Path
		 * @default "/ssl/cert/path"
		*/ certFile?: string
	}

	/** Dashboard Settings */ dashboard?: {
		/**
		 * Whether the Dashboard is enabled
		 * @default false
		*/ enabled?: boolean
		/**
		 * The Path to access the Dashboard on
		 * @default "/rjweb-dashboard"
		*/ path?: string
	}

	/**
	 * Where the Server should bind to
	 * @default "0.0.0.0"
	*/ bind?: string
	/**
	 * Whether X-Forwarded-For will be shown as hostIp
	 * @default false
	*/ proxy?: boolean
	/**
	 * The Method to use to compress data
	 * @default "none"
	*/ compression?: CompressTypes
	/**
	 * Whether all cors Headers will be set
	 * @default false
	*/ cors?: boolean
	/**
	 * Where the Server should start at
	 * @default 2023
	*/ port?: number
	/**
	 * Whether the Cache should be used for Routes, etc
	 * @default true
	*/ cache?: boolean
	/**
	 * Whether the rjweb-server Header will be added
	 * @default true
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
			}, https: {
				enabled: false,
				keyFile: '/ssl/key/path',
				certFile: '/ssl/cert/path'
			}, dashboard: {
				enabled: false,
				path: '/rjweb-dashboard'
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
				if (key in user) output[key] = user[key]
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