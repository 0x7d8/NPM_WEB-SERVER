import { Options } from "../functions/parseOptions"
import { DeepRequired } from "../types/internal"

export const colors = {
	reset: '\x1b[0m',
	bright: '\x1b[1m',
	dim: '\x1b[2m',
	underscore: '\x1b[4m',
	blink: '\x1b[5m',
	reverse: '\x1b[7m',
	hidden: '\x1b[8m',
	fg: {
		black: '\x1b[30m',
		red: '\x1b[31m',
		green: '\x1b[32m',
		yellow: '\x1b[33m',
		blue: '\x1b[34m',
		magenta: '\x1b[35m',
		cyan: '\x1b[36m',
		white: '\x1b[37m',
		gray: '\x1b[90m',
	}, bg: {
		black: '\x1b[40m',
		red: '\x1b[41m',
		green: '\x1b[42m',
		yellow: '\x1b[43m',
		blue: '\x1b[44m',
		magenta: '\x1b[45m',
		cyan: '\x1b[46m',
		white: '\x1b[47m',
		gray: '\x1b[100m',
		crimson: '\x1b[48m'
	}
}

/**
 * A Logger used for automatically parsing messages from any place
 * @example
 * ```
 * const logger = new Logger(...)
 * ```
 * @since 7.4.0
*/ export default class Logger {
	private options: DeepRequired<Options>['logging']

	/**
	 * Create a new Logger instance
	 * @since 7.4.0
	*/ constructor(options: DeepRequired<Options>['logging']) {
		this.options = options
	}

	/**
	 * Log an error message
	 * @since 7.4.0
	*/ public error(...messages: any[]): this {
		if (!this.options.error) return this

		console.error(`${colors.bg.red} ERROR ${colors.reset}`, ...messages)

		return this
	}

	/**
	 * Log a warn message
	 * @since 7.4.0
	*/ public warn(...messages: any[]): this {
		if (!this.options.warn) return this

		console.warn(`${colors.bg.yellow}  WARN ${colors.reset}`, ...messages)

		return this
	}

	/**
	 * Log a debug message
	 * @since 7.4.0
	*/ public debug(...messages: any[]): this {
		if (!this.options.debug) return this

		console.debug(`${colors.bg.blue} DEBUG ${colors.reset}`, ...messages)

		return this
	}
}