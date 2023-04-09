import { STATUS_CODES } from "http"

export default function parseStatus(status: number): string {
  const parsed = `${status} ${STATUS_CODES[status] ?? 'Unknown'}`

  return parsed
}