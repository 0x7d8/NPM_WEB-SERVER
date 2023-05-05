import parseContent, { Content } from "./parseContent"

export default async function parseHeaders(headers: Record<string, Content>): Promise<Record<string, Buffer>> {
	const parsedHeaders: Record<string, Buffer> = {}

	for (const header in headers) {
		try {
			parsedHeaders[header] = (await parseContent(headers[header])).content
		} catch { }
	}

	return parsedHeaders
}