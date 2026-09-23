import { createHash } from "crypto"
import type Cookie from "@/classes/Cookie"

const emptyCookies = '[]'
const fastHashMaxSize = 4096

const hex: string[] = []
for (let i = 0; i < 256; i++) hex.push(i.toString(16).padStart(2, '0'))

const statusHex: string[] = []
for (let i = 200; i < 400; i++) statusHex[i] = i.toString(16)

function cookiePrefix(cookies: Record<string, Cookie>): string {
  for (const _ in cookies) {
    return JSON.stringify(Object.values(cookies).map((v) => v.value))
  }

  return emptyCookies
}

function fmix32(h: number): number {
  h ^= h >>> 16
  h = Math.imul(h, 0x85ebca6b)
  h ^= h >>> 13
  h = Math.imul(h, 0xc2b2ae35)
  h ^= h >>> 16

  return h >>> 0
}

function hex32(h: number): string {
  return hex[h >>> 24] + hex[(h >>> 16) & 0xff] + hex[(h >>> 8) & 0xff] + hex[h & 0xff]
}

// two murmur3-style 32 bit lanes, sha1 has a high fixed cost for tiny inputs
function fastHash(prefix: string, data: Uint8Array): string {
  let a = 0x9747b28c, b = 0x5bd1e995

  for (let i = 0; i < prefix.length; i++) {
    const c = prefix.charCodeAt(i)

    a = Math.imul(a ^ c, 0xcc9e2d51)
    a = (a << 15) | (a >>> 17)
    b = Math.imul(b ^ c, 0x1b873593)
    b = (b << 13) | (b >>> 19)
  }

  const length = data.length, words = length & ~3
  let i = 0

  for (; i < words; i += 4) {
    const k = data[i] | (data[i + 1] << 8) | (data[i + 2] << 16) | (data[i + 3] << 24)

    a = Math.imul(a ^ k, 0xcc9e2d51)
    a = (a << 15) | (a >>> 17)
    a = (Math.imul(a, 5) + 0xe6546b64) | 0
    b = Math.imul(b ^ k, 0x1b873593)
    b = (b << 13) | (b >>> 19)
    b = (Math.imul(b, 5) + 0x561ccd1b) | 0
  }

  let k = 0
  switch (length & 3) {
    case 3: k ^= data[i + 2] << 16
    case 2: k ^= data[i + 1] << 8
    case 1: k ^= data[i]
      a = Math.imul(a ^ k, 0xcc9e2d51)
      b = Math.imul(b ^ k, 0x1b873593)
  }

  a ^= length
  b ^= length + prefix.length

  return hex32(fmix32(a)) + hex32(fmix32(b))
}

/**
 * Generate a Hash from a Body, Headers & Status Code to be used for caching,
 * small bodies use a fast 64 bit hash, larger ones SHA1
 * @since 6.0.0
*/ export default function toETag(data: ArrayBuffer, cookies: Record<string, Cookie>, status: number): `W/"${string}-${string}"` | null {
  if (status < 200 || status >= 400) return null

  const prefix = cookiePrefix(cookies)

  let hashed: string
  if (data.byteLength <= fastHashMaxSize) {
    hashed = fastHash(prefix, new Uint8Array(data))
  } else {
    hashed = createHash('sha1')
      .update(prefix)
      .update(new Uint8Array(data))
      .digest('hex')
  }

  return `W/"${statusHex[status] ?? status.toString(16)}-${hashed}"`
}
