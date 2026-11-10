export type Range = {
	start: number
	end: number
}

const pattern = /^bytes=(\d*)-(\d*)$/

/**
 * Parse a `range` header for a resource of the given size, both ends of the result are inclusive
 * 
 * Returns `null` when the header should be ignored (invalid, multiple ranges, not in bytes, empty resource)
 * and `'unsatisfiable'` when it is valid but outside of the resource
 * @since 9.10.0
*/ export default function parseRange(header: string, size: number): Range | 'unsatisfiable' | null {
	const match = pattern.exec(header.trim())
	if (!match || size === 0) return null

	const first = match[1], last = match[2]
	if (!first && !last) return null

	if (!first) {
		const suffix = parseInt(last)
		if (!Number.isSafeInteger(suffix)) return null
		if (suffix === 0) return 'unsatisfiable'

		return { start: Math.max(0, size - suffix), end: size - 1 }
	}

	const start = parseInt(first)
	if (!Number.isSafeInteger(start)) return null

	let end = size - 1
	if (last) {
		const requested = parseInt(last)
		if (!Number.isSafeInteger(requested) || requested < start) return null

		end = Math.min(requested, end)
	}

	if (start >= size) return 'unsatisfiable'

	return { start, end }
}
