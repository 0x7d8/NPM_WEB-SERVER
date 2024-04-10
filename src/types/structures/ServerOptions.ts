import { DeepRequired, network } from "@rjweb/utils"
import { CompressionAlgorithm } from "@/types/global"

export type ServerOptions = {
	/**
	 * The Port to use for the Server, can be random using `0`
	 * @default 0
	 * @since 0.0.1
	*/ port?: number
	/**
	 * THe IP Address to bind the server to
	 * @default "0.0.0.0"
	 * @since 0.0.4
	*/ bind?: string
	/**
	 * Whether to add the `rjweb-server` header that contains the version
	 * @default true
	 * @since 9.0.0
	*/ version?: boolean

	/**
	 * Various Compression-Related Settings
	 * @since 9.0.0
	*/ compression?: {
		/**
		 * HTTP Compression Settings
		 * @since 9.0.0
		*/ http?: {
			/**
			 * Whether HTTP Compression is enabled
			 * @default true
			 * @since 9.0.0
			*/ enabled?: boolean
			/**
			 * The Order in which to prefer Compression Algorithms, non included wont be used
			 * @default ["brotli", "gzip", "deflate"]
			 * @since 9.0.0
			*/ preferOrder?: CompressionAlgorithm[]
			/**
			 * The Maximum Size of an Item allowed to be compressed
			 * @default size(10).mb()
			 * @since 9.0.0
			*/ maxSize?: number
			/**
			 * The Minimum Size of an Item allowed to be compressed
			 * @default size(1).kb()
			*/ minSize?: number
		}

		/**
		 * WebSocket Compression Settings
		 * @since 9.0.0
		*/ ws?: {
			/**
			 * Whether WebSocket Compression is enabled
			 * @default true
			 * @since 9.0.0
			*/ enabled?: boolean
			/**
			 * The Maximum Size of an Item allowed to be compressed
			 * @default size(1).mb()
			 * @since 9.0.0
			*/ maxSize?: number
		}
	}

	/**
	 * Various Performance-Related Settings
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
	}

	/**
	 * Various Logging-Related Settings
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
		*/ force?: boolean
		/**
		 * Whether to compress the requests
		 * @default false
		 * @since 9.0.0
		*/ compress?: boolean
		/**
		 * The Header to use for getting the actual IP address, it must only include the IP address
		 * @default "x-forwarded-for"
		 * @since 8.0.0
		*/ header?: Lowercase<string>

		/**
		 * The IPs the server will validate against
		 * @since 9.0.0
		*/ ips?: {
			/**
			 * Whether to validate proxy ips
			 * @default false
			 * @since 9.0.0
			*/ validate?: boolean
			/**
			 * The Mode in which to validate the list
			 * @default "whitelist"
			 * @since 9.0.0
			*/ mode?: 'whitelist' | 'blacklist'
			/**
			 * The List of Authorized (or Unauthorized) Proxy IPs
			 * @default [...ReverseProxyIps.LOCAL, ...ReverseProxyIps.CLOUDFLARE]
			 * @since 9.0.0
			*/ list?: (network.IPAddress | network.Subnet)[]
		}

		/**
		 * The Credentials that the proxy will use
		 * @since 8.0.0
		*/ credentials?: {
			/**
			 * Whether to authenticate proxy requests
			 * @default false
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
}

export type FullServerOptions = DeepRequired<ServerOptions>