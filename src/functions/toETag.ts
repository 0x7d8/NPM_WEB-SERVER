import { createHash } from "crypto"
import { Content } from "./parseContent"
import { CookieSettings } from "../types/internal"

/**
 * Generate a Hash from a Body, Headers & Status Code to be used for caching using SHA1
 * @since 6.0.0
*/ export default function toETag(data: Buffer, headers: Record<string, Content>, cookies: Record<string, CookieSettings>, status: number) {
  if (status < 200 || status >= 300) return null

  const hashed = createHash('sha1')
    .update(JSON.stringify(headers))
    .update(JSON.stringify(Object.values(cookies).map((v) => v.value)))
    .update(data)
    .digest('hex')

  return `${status.toString(16)}-${hashed}`
}