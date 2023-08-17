import { zValidate } from "rjutils-collection"

export default class RouteContentTypes {
	private contentTypes: Record<string, string>

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
	 * controller.contentTypes((cT) => cT
	 *   .add('.png', 'image/png')
	 * )
	 * ```
	 * @since 5.3.0
	*/ @zValidate([ (z) => z.string(), (z) => z.string() ])
	public add(
		/** The File ending to apply this to */ ending: string,
		/** The Content Type to add to it */ contentType: string
	): this {
		this.contentTypes[ending] = contentType

		return this
	}


	/**
	 * Internal Method for Generating Content Types Object
	 * @since 5.3.0
	*/ public getData() {
		return {
			contentTypes: this.contentTypes
		}
	}
}