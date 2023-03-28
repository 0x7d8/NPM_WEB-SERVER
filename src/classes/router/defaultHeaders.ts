import parseContent, { Content } from "../../functions/parseContent"

export default class RouteContentTypes {
	protected defaultHeaders: Record<Lowercase<string>, Content>

	/** Generate Content Type Block */
	constructor(
		/** Headers to import */ defaultHeaders: Record<string, Content> = {}
	) {
		this.defaultHeaders = defaultHeaders
	}

	/**
	 * Add A Header that will be added to every HTTP request
	 * @example
	 * ```
	 * const controller = new Server({ })
	 * 
	 * controller.defaultHeaders()
	 *   .add('Copyright', 2023)
	 * ```
	 * @since 5.3.0
	*/
	add(
		/** The Name of the Header */ name: Lowercase<string>,
		/** The Value of the Header */ contentType: Content
	) {
		this.defaultHeaders[name] = contentType

		return this
	}


	/**
	 * Internal Method for Generating Headers Object
	 * @since 5.3.0
	*/
	protected async getHeaders() {
		const parsedHeaders: Record<string, string> = {}

		for (const header in this.defaultHeaders) {
			try {
				const value = (await parseContent(this.defaultHeaders[header as any])).content.toString()
				parsedHeaders[header] = value
			} catch (err) { }
		}

		return {
			defaultHeaders: parsedHeaders
		}
	}
}