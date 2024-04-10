import ValueCollection from "@/classes/ValueCollection"

export default class ContentTypes {
	protected data = new ValueCollection<string, string>()

	/**
	 * Add A File -> Content Type Mapping
	 * @example
	 * ```
	 * const server = new Server(...)
	 * 
	 * server.contentTypes((cT) => cT
	 *   .add('.png', 'image/png')
	 * )
	 * ```
	 * @since 5.3.0
	*/ public map(
		/** The File ending to apply this to */ ending: string,
		/** The Content Type to add to it */ contentType: string
	): this {
		this.data.set(ending, contentType)

		return this
	}
}