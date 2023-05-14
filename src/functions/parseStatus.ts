import { STATUS_CODES } from "http"

/**
 * Parses an Status Code into a full HTTP Status
 * @since 5.9.5
*/ export default function parseStatus(status: number, message?: string): string {
	const parsed = `${status} ${message ?? STATUS_CODES[status] ?? 'Unknown'}`

	return parsed
}