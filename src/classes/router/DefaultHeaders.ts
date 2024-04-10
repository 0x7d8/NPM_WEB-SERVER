import { Content } from "@/functions/parseContent"

export default class RouteContentTypes {
	private defaultHeaders: Record<string, Content>

	constructor(defaultHeaders: Record<string, Content> = {}) {
		this.defaultHeaders = defaultHeaders
	}

	/**
	 * Add A Header that will be added to every HTTP request
	 * @example
	 * ```
	 * const server = new Server(...)
	 * 
	 * server.defaultHeaders((dH) => dH
	 *   .add('Copyright', 2023)
	 * )
	 * ```
	 * @since 5.3.0
	*/ public add(
		/** The Name of the Header */ name: Lowercase<string>,
		/** The Value of the Header */ contentType: Content
	): this {
		this.defaultHeaders[name] = contentType

		return this
	}


	/**
	 * Internal Method for Generating Headers Object
	 * @since 6.0.0
	*/ protected getData() {
		return {
			defaultHeaders: this.defaultHeaders
		}
	}
}