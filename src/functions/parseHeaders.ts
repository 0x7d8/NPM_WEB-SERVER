import Logger from "../classes/logger"
import parseContent, { Content } from "./parseContent"

/**
 * Parses Headers to be compatible with HTTP
 * @since 7.3.0
*/ export default async function parseHeaders(headers: Record<string, Content>, logger: Logger): Promise<Record<string, Buffer>> {
	const parsedHeaders: Record<string, Buffer> = {}

	for (const header in headers) {
		try {
			parsedHeaders[header] = (await parseContent(headers[header], false, logger)).content
		} catch (err) {
			logger.error(`Failed parsing header "${header}" with content "${parsedHeaders[header]}":`, err)
		}
	}

	return parsedHeaders
}