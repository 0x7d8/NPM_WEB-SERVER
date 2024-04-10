export default class RuntimeError {
	/**
	 * Create a new Runtime Error
	 * @since 9.0.0
	*/ constructor(cause: string, error: unknown) {
		this.cause = cause
		this.error = error
	}

	/**
	 * The Cause of this Error
	 * @since 9.0.0
	*/ public cause: string
	/**
	 * The Actual Error
	 * @since 9.0.0
	*/ public error: unknown

	/**
	 * Get the Error message
	 * @since 9.0.0
	*/ public toString(): string {
		return `(${this.cause})\n\n${this.error instanceof Error ? this.error.stack ?? this.error.message : String(this.error)}`
	}
}