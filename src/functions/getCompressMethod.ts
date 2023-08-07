import { HttpResponse } from "@rjweb/uws"
import { CompressTypes } from "./handleCompressType"
import { GlobalContext } from "../types/context"

const write = (res: HttpResponse, chunk: ArrayBuffer): boolean => {
	let result = false
	res.cork(() => result = res.write(chunk))

	return result
}

const tryEnd = (res: HttpResponse, chunk: ArrayBuffer, totalSize: number): boolean => {
	let result = [false, false]
	res.cork(() => result = res.tryEnd(chunk, totalSize))

	return result[0]
}

/**
 * Get the best compression using a header
 * @since 8.0.0
*/ export default function getCompressMethod(doCompress: boolean, header: string, res: HttpResponse, totalSize: number, ctg: GlobalContext): [CompressTypes, string | undefined, (chunk: ArrayBuffer) => boolean] {
	if (!doCompress || !ctg.options.httpCompression.enabled || ctg.options.httpCompression.maxSize < totalSize) return ['none', undefined, (chunk) => tryEnd(res, chunk, totalSize)]

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
			if (ctg.options.httpCompression.disabledAlgorithms.includes(tempValue as never)) prio = NaN

			switch (tempValue as CompressTypes) {
				case "br":
					if (isNaN(prio)) {
						if (!ctg.options.httpCompression.disabledAlgorithms.includes('br')) prio = -0.1
						else prio = -Infinity
						break
					} else break

				case "gzip":
					if (isNaN(prio)) {
						if (!ctg.options.httpCompression.disabledAlgorithms.includes('gzip')) prio = -0.2
						else prio = -Infinity
						break
					} else break

				case "deflate":
					if (isNaN(prio)) {
						if (!ctg.options.httpCompression.disabledAlgorithms.includes('deflate')) prio = -0.3
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

	return [highestValue as CompressTypes, highestValue === 'none' ? undefined : highestValue, highestValue !== 'none' ? (chunk) => write(res, chunk) : (chunk) => tryEnd(res, chunk, totalSize)]
}