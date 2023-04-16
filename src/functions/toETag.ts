import { createHash } from "crypto"
import typia from "typia"

export default function toETag(data: Buffer, headers: Record<string, string | Buffer>, status: number) {
  if (status < 200 || status >= 300) return null

  const hashed = createHash('sha1')
    .update(typia.stringify(headers))
    .update(data)
    .digest('hex')

  return `${status.toString(16)}-${hashed}`
}