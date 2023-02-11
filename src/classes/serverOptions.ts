import rateLimitRule from "../interfaces/ratelimitRule"
import { CompressTypes } from "../functions/handleCompressType"
import routeList from "./routeList"

export interface Options {
	/** The Routes for the Server */ routes: routeList
	/** RateLimit Settings */ rateLimits?: {
		/**
		 * Whether Ratelimits are enabled
		 * @default false
		*/ enabled?: boolean
		/**
		 * The Message that gets sent when a ratelimit maxes out
		 * @default "Rate Limited"
		*/ message?: any
		/**
		 * The List of Ratelimit Rules
		 * @default []
		*/ list?: rateLimitRule[]
		/**
     * The RateLimit Functions
     * @default Map
     */ functions?: {
			set: (key: string, value: number) => Promise<any>
			get: (key: string) => Promise<number>
		} | Map<string, number>
	}

	/** HTTP Body Settings */ body?: {
		/**
		 * Whether recieving HTTP Bodies is enabled
		 * @default true
		*/ enabled?: boolean
		/**
		 * Whether to try parsing the HTTP Body as JSON
		 * @default true
		*/ parse?: boolean
		/**
		 * The Maximum Size of the HTTP Body in MB
		 * @default 5
		*/ maxSize?: number
		/**
		 * The Message that gets sent when the HTTP Body Size is exceeded
		 * @default "Payload too large"
		*/ message?: any
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

	/** Header Settings */ headers?: {
		[key: string]: string | number
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
	 * Add X-Powered-By Header
	 * @default true
	*/ poweredBy?: boolean
}

export default class serverOptions {
  private data: Options

  /** Server Options Helper */
  constructor(options: Partial<Options>) {
		this.data = this.mergeOptions({
      routes: new routeList(),
      rateLimits: {
        enabled: false,
        message: 'Rate Limited',
        list: [],
        functions: new Map<string, number>()
      }, body: {
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
			}, headers: {},
			bind: '0.0.0.0',
      proxy: false,
			compression: 'none',
      cors: false,
      port: 2023,
      poweredBy: true
    }, options)
  }

	private mergeOptions(...objects: Partial<Options>[]): Options {
		const isObject = (obj: Options) => (obj && typeof obj === 'object')

		return objects.reduce((prev, obj) => {
			Object.keys(obj).forEach((key) => {
				const pVal = prev[key]
				const oVal = obj[key]

				if (key !== 'functions' && key !== 'routes') {
					if (Array.isArray(pVal) && Array.isArray(oVal)) prev[key] = pVal.concat(...oVal)
					else if (isObject(pVal) && isObject(oVal)) prev[key] = this.mergeOptions(pVal, oVal)
					else prev[key] = oVal
				} else prev[key] = oVal
			})
			
			return prev
		}, {}) as any
	}

  /** Get the Resulting Options */
  getOptions() {
    return this.data
  }
}