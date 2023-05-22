import Logger from "../classes/logger"
import parseContent, { Content } from "./parseContent"

/**
 * Parses Headers to be compatible with HTTP
 * @since 7.3.0
*/ export default async function parseHeaders(headers: Record<string, Content>, logger: Logger): Promise<Record<string, Buffer>> {
	const parsedHeaders: Record<string, Buffer> = {}

	try {
		const rawKeys = Object.keys(headers).filter((key) => Boolean(headers[key]))
		const parsedValues = await Promise.all([ ...Object.values(headers).filter(Boolean).map((h) => parseContent(h)) ])

		for (let i = 0; i < rawKeys.length; i++) {
			parsedHeaders[rawKeys[i]] = parsedValues[i].content
		}
	} catch (err) {
		logger.error('Failed parsing Headers', headers, err)
	}

	return parsedHeaders
}