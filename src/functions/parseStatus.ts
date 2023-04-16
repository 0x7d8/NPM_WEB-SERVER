import { STATUS_CODES } from "http"

export default function parseStatus(status: number, message?: string): string {
	const parsed = `${status} ${message ?? STATUS_CODES[status] ?? 'Unknown'}`

	return parsed
}