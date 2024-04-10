import Route from "@/classes/Route"
import ValueCollection from "@/classes/ValueCollection"
import { Implementation } from "@/types/implementation"
import { FullServerOptions } from "@/types/structures/ServerOptions"
import { ClassContexts, EndFn, ErrorCallbacks, FinishCallbacks, RatelimitCallbacks, RealAny } from "@/types/internal"
import Logger from "@/classes/Logger"
import Channel from "@/classes/Channel"
import { CompressionAlgorithm } from "@/types/global"
import toArrayBuffer from "@/functions/toArrayBuffer"
import HttpRequestContext from "@/classes/request/HttpRequestContext"

export default class GlobalContext {
	constructor(options: FullServerOptions, public implementation: Implementation, classContexts: ClassContexts) {
		this.options = options
		this.logger = new Logger(options.logging)
		this.classContexts = classContexts
	}

	/**
	 * The Routes available for searching
	 * @since 9.0.0
	*/ public routes: {
		http: Route<'http'>[]
		ws: Route<'ws'>[]
		static: Route<'static'>[]
	} = {
		http: [],
		ws: [],
		static: []
	}

	/**
	 * The Options for the Server
	 * @since 9.0.0
	*/ public options: FullServerOptions
	/**
	 * The Logger for Internal Events
	 * @since 9.0.0
	*/ public logger: Logger
	/**
	 * Channels that were used with the server
	 * @since 9.0.0
	*/ public channels: Channel[] = []
	/**
	 * Class Contexts used to create the ctr object
	 * @since 9.0.0
	*/ public classContexts: ClassContexts
	/**
	 * The Error handlers
	 * @since 9.0.0
	*/ public errorHandlers: ErrorCallbacks<any> = {}
	/**
	 * The Finish handlers
	 * @since 9.0.0
	*/ public finishHandlers: FinishCallbacks<any> = {}
	/**
	 * The Ratelimit Handlers
	 * @since 9.0.0
	*/ public rateLimitHandlers: RatelimitCallbacks<any> = {}
	/**
	 * The Not Found handler
	 * @since 9.0.0
	*/ public notFoundHandler: ((ctr: HttpRequestContext<any>) => RealAny) | null = null
	/**
	 * The HTTP callback handler
	 * @since 9.0.0
	*/ public httpHandler: ((ctr: HttpRequestContext<any>, end: EndFn) => RealAny) | null = null
	/**
	 * Content Type Mappings
	 * @since 9.0.0
	*/ public contentTypes = new ValueCollection<string, string>()
	/**
	 * Rate Limit Store
	 * @since 9.0.0
	*/ public rateLimits = new ValueCollection<`${'http' | 'ws'}+${string}-${number}`, { hits: number, end: number }>()

	/**
	 * Caches for various methods
	 * @since 9.0.0
	*/ public cache = {
		/**
		 * The Cached base64 encoded proxy credentials
		 * @since 9.0.0
		*/ proxyCredentials: '',
		/**
		 * Cached ArrayBuffer Texts
		 * @since 9.0.0
		*/ arrayBufferTexts: {
			proxy_auth_invalid: toArrayBuffer('Invalid Proxy Authentication Provided'),
			proxy_auth_required: toArrayBuffer('Proxy Authentication Required'),
			route_not_found: toArrayBuffer('Route Not Found'),
			rate_limit_exceeded: toArrayBuffer('Rate Limit Exceeded')
		},
		/**
		 * The Cache for the Compression Methods Header parsing
		 * @since 9.0.0
		*/ compressionMethods: new ValueCollection<string, CompressionAlgorithm>(undefined, undefined, true, 100),
		/**
		 * The Cache for static files
		 * @since 9.0.0
		*/ staticFiles: new ValueCollection<string, [path: string, route: Route<'static'>]>(undefined, undefined, true, 1500)
	}
}