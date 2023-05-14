import { createHash } from "crypto"

/**
 * Generate a Hash from a Body, Headers & Status Code to be used for caching using SHA1
 * @since 6.0.0
*/ export default function toETag(data: Buffer, headers: Record<string, string | Buffer>, status: number) {
  if (status < 200 || status >= 300) return null

  const hashed = createHash('sha1')
    .update(JSON.stringify(headers))
    .update(data)
    .digest('hex')

  return `${status.toString(16)}-${hashed}`
}