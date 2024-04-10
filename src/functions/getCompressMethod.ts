import { CompressionAlgorithm } from "@/types/global"
import GlobalContext from "@/types/internal/classes/GlobalContext"
import { as } from "@rjweb/utils"

/**
 * Get the best compression using a header
 * @since 8.0.0
*/ export default function getCompressMethod(doCompress: boolean, header: string, size: number, proxied: boolean, global: GlobalContext): CompressionAlgorithm | null {
	if (
		!doCompress
		|| !global.options.compression.http.enabled
		|| size > global.options.compression.http.maxSize
		|| size < global.options.compression.http.minSize
		|| (proxied && !global.options.proxy.compress)
	) return null
	if (global.cache.compressionMethods.has(header)) return global.cache.compressionMethods.get(header)!

	let highestValue = 'none', highestPriority = -Infinity, tempValue = '', tempPriority = ''

	header += ','

	let progress = 0, mode: 'value' | 'prio' = 'value'
	while (progress < header.length) {
		if (!header[progress] || header[progress] === ' ') {
			progress++
			continue
		}

		if (header[progress] === ',') {
			let prio = parseInt(tempPriority)
			if (!global.options.compression.http.preferOrder.includes(tempValue === 'br' ? 'brotli' : as<CompressionAlgorithm>(tempValue))) prio = NaN

			switch (as<'gzip' | 'deflate' | 'br'>(tempValue)) {
				case "br":
					if (isNaN(prio)) {
						if (global.options.compression.http.preferOrder.includes('brotli')) prio = -(global.options.compression.http.preferOrder.indexOf('brotli') / 10)
						else prio = -Infinity
						break
					} else break

				case "gzip":
					if (isNaN(prio)) {
						if (global.options.compression.http.preferOrder.includes('gzip')) prio = -(global.options.compression.http.preferOrder.indexOf('gzip') / 10)
						else prio = -Infinity
						break
					} else break

				case "deflate":
					if (isNaN(prio)) {
						if (global.options.compression.http.preferOrder.includes('deflate')) prio = -(global.options.compression.http.preferOrder.indexOf('deflate') / 10)
						else prio = -Infinity
						break
					} else break

				default:
					prio = -Infinity
					break
			}

			mode = 'value'
			tempValue = tempValue
			highestValue = prio > highestPriority ? tempValue : highestValue
			highestPriority = prio > highestPriority ? prio : highestPriority
			tempPriority = ''
			tempValue = ''
		} else if (header[progress] === ';') {
			mode = 'prio'
		} else {
			if (mode === 'value') {
				tempValue += header[progress]
			} else {
				if (header[progress] !== 'q' && header[progress] !== '=') {
					tempPriority += header[progress]
				}
			}
		}

		progress++
	}

	const result = highestValue === 'none' ? null : as<CompressionAlgorithm>(highestValue === 'br' ? 'brotli' : highestValue)
	if (result) global.cache.compressionMethods.set(header, result)

	return result
}