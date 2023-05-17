import { STATUS_CODES } from "http"

/**
 * Parses an Status Code into a full HTTP Status
 * @since 5.9.5
*/ export default function parseStatus(code: number, message?: string): string {
	const parsed = `${code} ${message ?? STATUS_CODES[code] ?? 'Unknown'}`

	return parsed
}