let cachedDate: string | null = null

function resetDate(): void {
	cachedDate = null
}

/**
 * Get the current date formatted for the HTTP `date` header, cached until the next second starts
 * @since 9.9.1
*/ export default function httpDate(): string {
	if (cachedDate === null) {
		const now = new Date()

		cachedDate = now.toUTCString()
		setTimeout(resetDate, 1000 - now.getMilliseconds()).unref()
	}

	return cachedDate
}
