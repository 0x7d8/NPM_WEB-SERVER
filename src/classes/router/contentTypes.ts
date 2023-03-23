export default class RouteContentTypes {
	protected contentTypes: Record<string, string>

	/** Generate Content Type Block */
	constructor(
		/** Content Types to import */ contentTypes: Record<string, string> = {}
	) {
		this.contentTypes = contentTypes
	}

	/**
	 * Add A File -> Content Type Mapping
	 * @example
	 * ```
	 * const controller = new Server({ })
	 * 
	 * controller.contentTypes()
	 *   .add('.png', 'image/png')
	 * ```
	 * @since 5.3.0
	*/
	add(
		/** The File ending to apply this to */ ending: string,
		/** The Content Type to add to it */ contentType: string
	) {
		this.contentTypes[ending] = contentType

		return this
	}


	/**
	 * Internal Method for Generating Content Types Object
	 * @since 5.3.0
	*/
	protected getTypes() {
		return {
			contentTypes: this.contentTypes
		}
	}
}