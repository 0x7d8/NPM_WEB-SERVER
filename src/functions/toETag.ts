import { createHash } from "crypto"
import { Content } from "@/types/global"
import Cookie from "@/classes/Cookie"

/**
 * Generate a Hash from a Body, Headers & Status Code to be used for caching using SHA1
 * @since 6.0.0
*/ export default function toETag(data: ArrayBuffer, headers: Record<string, Content>, cookies: Record<string, Cookie>, status: number): `W/"${string}-${string}"` | null {
  if (status < 200 || status >= 400) return null

  const hashed = createHash('sha1')
    .update(JSON.stringify(headers))
    .update(JSON.stringify(Object.values(cookies).map((v) => v.value)))
    .update(Buffer.from(data))
    .digest('hex')

  return `W/"${status.toString(16)}-${hashed}"`
}