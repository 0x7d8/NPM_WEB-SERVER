import Route from "../types/http"
import HTMLBuilder, { FnArgument, GetEvery } from "./HTMLBuilder"

export default class HTMLComponent<Options extends Record<any, any> = {}> {
	private callback: (tag: HTMLBuilder, options: Options | undefined) => HTMLBuilder

	/**
	 * Create a new HTML Component
	 * @example
	 * ```
   * // component.js
	 * module.exports = new HTMLComponent((html, options) => html
	 *   .t('p', {}, options.text)
	 * )
	 * 
   * // index.js
	 * const component = require('./component.js')
   * const controller = new Server({ })
   * 
   * controller.path('/', (path) => path
	 *   .http('GET', '/', (http) => http
	 *     .onRequest((ctr) => {
	 *       ctr.printHTML((html) => html
	 *         .t('h1', {}, 'Hello matey!')
	 *         .c(component, { text: 'lol' })
	 *       )
	 *     })
	 *   )
	 * )
   * ```
	 * @since 6.7.0
	*/ constructor(
		/** The Callback for defining the Component */ callback: (tag: HTMLBuilder, options: Options | undefined) => HTMLBuilder
	) {
		this.callback = callback
	}

	/**
	 * Internal Method for Generating HTML Builder
	 * @since 6.7.0
	*/ protected toBuilder(route: string, fnArguments: FnArgument[], getEvery: GetEvery[], getEveryId: { n: number }, options: Options | undefined): HTMLBuilder {
		const builder = new HTMLBuilder(route, fnArguments, getEvery, getEveryId)
		this.callback(builder, options)

		return builder
	}
}