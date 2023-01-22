import rateLimitRule from "../interfaces/ratelimitRule"
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
	 * Whether all cors headers are set
	 * @default false
	*/ cors?: boolean
	/**
	 * Where the Server should start at
	 * @default 2023
	*/ port?: number
	/**
	 * The Maximum Body Size in MB
	 * @default 5
	*/ maxBody?: number
	/**
	 * Add X-Powered-By Header
	 * @default true
	*/ poweredBy?: boolean
}

export default class serverOptions {
  private data: Options

  /** Server Options Helper */
  constructor(options: Options) {
		this.data = this.mergeOptions({
      routes: new routeList(),
      rateLimits: {
        enabled: false,
        message: 'Rate Limited',
        list: [],
        functions: new Map<string, number>()
      }, dashboard: {
				enabled: false,
				path: '/rjweb-dashboard'
			}, bind: '0.0.0.0',
      proxy: false,
      cors: false,
      port: 2023,
      maxBody: 5,
      poweredBy: true
    }, options)
  }

	private mergeOptions(...objects: Options[]): Options {
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