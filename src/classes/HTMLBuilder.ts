import Route, { HTTPRequestContext } from "../types/http"
import HTMLTag from "../types/htmlTag"
import { RealAny } from "../types/internal"
import { hashStr } from "rjutils-collection"

export type HTMLContent =
	| string
	| number
	| boolean
	| undefined

export type HTMLAttribute =
	| string
	| number
	| boolean
	| undefined
	| Function
	| HTMLAttribute[]
	| HTMLAttributeRecord

type FnArgument = {
	name: string
	value: any
}

type GetEvery = {
	id: string
	getter(ctr: HTTPRequestContext): RealAny
	callback(tag: HTMLBuilder, data: any): HTMLBuilder
	fnArguments: FnArgument[]
}

interface HTMLAttributeRecord extends Record<string, HTMLAttribute> { }

const f = (attribute: string): string => {
	return attribute
		.replace(/"/g, '&quot;')
		.replace(/\n/g, '&#xa;')
}

const fF = (fn: Function): string => {
	let fnString = fn.toString()
	let addStart = '', addEnd = ''

	fnString = fnString
		.replace('async', () => {
			addStart += 'async'
			return ''
		})
		.replace('=>', () => {
			addStart += ' function'
			return ''
		})
	
	return addStart + fnString + addEnd
}

export const getFunctionArguments = (fn: Function) => {  
	return (fn.toString())
		.replace(/[/][/].*$/mg,'')
		.replace(/\s+/g, '')
		.replace(/[/][*][^/*]*[*][/]/g, '')
		.split('){', 1)[0].replace(/^[^(]*[(]/, '')
		.replace(/=[^,]+/g, '')
		.split(',').filter(Boolean)
}

export const parseAttributes = (attributes: Record<string, HTMLAttribute>, fnArguments: FnArgument[]): string => {
	let result = ''
	Object.entries(attributes).forEach(([ key, attribute ]) => {
		let value = ''

		switch (typeof attribute) {
			case "object": {
				if (Array.isArray(attribute)) {
					if (key === 'class') {
						value = attribute.join(' ')
					} else {
						value = f(JSON.stringify(attribute))
					}
				} else {
					if (key === 'style') {
						Object.entries(attribute).forEach(([ key, val ]) => {
							value += `${f(key)}:${f(JSON.stringify(val)).replace(/&quot;/g, '')};`
						})
					} else {
						value = f(JSON.stringify(attribute))
					}
				}

				break
			}

			case "function": {
				value = f(`${fnArguments.map((arg) => `let ${arg.name}=${f(JSON.stringify(arg.value))};`).join('')}(${fF(attribute)})(this)`)

				break
			}

			default: {
				value = f(String(attribute))

				break
			}
		}

		result += `${key.replace(/"/g, '')}="${value}"`
	})

	return result
}

export default class HTMLBuilder {
	protected html = ''
	protected fnArguments: FnArgument[]
	protected getEveries: GetEvery[]
	private route: Route
	private everyId: { n: number }

	constructor(route: Route, fnArguments: FnArgument[] = [], getEvery: GetEvery[] = [], everyId: { n: number } = { n: 0 }) {
		this.fnArguments = fnArguments
		this.getEveries = getEvery
		this.route = route
		this.everyId = everyId
	}

	/**
	 * Add a new HTML Tag
	 * @example
	 * ```
	 * ctr.printHTML((html) => html
	 *   .t('div', {}, (t) => t
	 *     .t('p', {}, (t) => t
	 *       .raw('hello world!')
	 *     )
	 *     .t('p', {}, 'hello world!')
	 *   )
	 * )
	 * ```
	 * @since 6.6.0
	*/ t(
		/** The HTML Tag name */ tag: HTMLTag,
		/** The HTML Attributes to add */ attributes: Record<string, HTMLAttribute>,
		/** The Callback */ callback: ((tag: HTMLBuilder) => HTMLBuilder) | HTMLContent
	) {
		this.html += `<${tag} ${parseAttributes(attributes, this.fnArguments)}>`

		if (typeof callback === 'function') {
			const builder = new HTMLBuilder(this.route, [ ...this.fnArguments ], this.getEveries, this.everyId)

			callback(builder)
			this.html += builder.html
		} else {
			this.html += callback
		}

		this.html += `</${tag}>`
		return this
	}

	/**
	 * Add raw Content
	 * @example
	 * ```
	 * ctr.printHTML((html) => html
	 *   .t('div', {}, (t) => t
	 *     .t('p', {}, (t) => t
	 *       .raw('hello world!')
	 *     )
	 *   )
	 * )
	 * ```
	 * @since 6.6.0
	*/ raw(
		/** The Raw Content to add */ content: HTMLContent
	) {
		this.html += content

		return this
	}

	/**
	 * Register Variables that will be added to every context
	 * @warning This is required for native functions because they are being replicated 1:1
	 * @example
	 * ```
	 * const version = '1.0.0'
	 * 
	 * ctr.printHTML((html) => html
	 *   .var({ version })
	 *   .t('button', { onclick() { alert(version) } }, (t) => t
	 *     .raw('click me for version!')
	 *   )
	 * )
	 * ```
	 * @since 6.6.0
	*/ var(
		/** The Variables as Object */ variables: Record<string, any>
	) {
		Object.keys(variables).forEach((key) => {
			this.fnArguments.push({
				name: key,
				value: variables[key]
			})
		})

		return this
	}

	/**
	 * Register Variables that will be added to every context
	 * @warning This is required for native functions because they are being replicated 1:1
	 * @example
	 * ```
	 * const version = '1.0.0'
	 * const showVersion = true
	 * 
	 * ctr.printHTML((html) => html
	 *   .var({ version })
	 *   .if(showVersion, (html) => html
	 *     .t('button', { onclick: () => { alert(version) } }, (t) => t
	 *       .raw('click me for version!')
	 *     )
	 *   )
	 * )
	 * ```
	 * @since 6.6.1
	*/ if(
		/** The Boolean to check */ state: boolean,
		/** The Callback for when the Boolean is truthy */ callback: ((tag: HTMLBuilder) => HTMLBuilder) | HTMLContent
	) {
		if (state) {
			if (typeof callback === 'function') {
				const builder = new HTMLBuilder(this.route, [ ...this.fnArguments ], this.getEveries, this.everyId)

				callback(builder)
				this.html += builder.html
			} else {
				this.html += callback
			}
		}

		return this
	}

	/**
	 * Fetch a custom function every x ms
	 * @example
	 * ```
	 * const getNumbers = () => Array.from({ length: 5 }).map(() => Math.random())
	 * 
	 * ctr.printHTML((html) => html
	 *   .getEvery(getNumbers, 1000, (t, numbers) => t
	 *     .forEach(numbers, (t, name) => t
	 *       .t('p', {}, (t) => t
	 *         .raw(`I love ${name}`)
	 *       )
	 *     )
	 *   )
	 * )
	 * ```
	 * @since 6.6.0
	*/ getEvery<T extends (ctr: HTTPRequestContext) => RealAny>(
		/** The Function to get Data */ getter: T,
		/** The Interval for Iterations (ms) */ interval: number,
		/** The Callback for each Iteration */ callback: (tag: HTMLBuilder, item: Awaited<ReturnType<T>>) => HTMLBuilder
	) {
		const id = `${this.route.path.replace('/', '-')}___rId___${this.everyId.n++}___${hashStr({ text: callback.toString(), algorithm: 'sha1' })}`

		this.html += `<div id="${id}" style="display: contents;"></div>`
		this.html += `<script type="text/javascript">setInterval(function(){var e=new XMLHttpRequest;e.onreadystatechange=function(){e.readyState===XMLHttpRequest.DONE&&e.status>199&&e.status<300&&(document.getElementById("${id}").innerHTML=e.responseText)},e.open("GET","/___rjweb-html-auto/${id}",!0),e.send()},${interval})</script>`

		this.getEveries.push({
			getter,
			callback,
			fnArguments: [ ...this.fnArguments, { name: getFunctionArguments(callback)[1].replace(')', ''), value: null } ],
			id
		})

		return this
	}

	/**
	 * Loop over an Array of Items
	 * @example
	 * ```
	 * const items = [
	 *   'Ben',
	 *   'John',
	 *   'Pork'
	 * ]
	 * 
	 * ctr.printHTML((html) => html
	 *   .t('div', {}, (t) => t
	 *     .forEach(items, (t, name) => t
	 *       .t('p', {}, (t) => t
	 *         .raw(`I love ${name}`)
	 *       )
	 *     )
	 *   )
	 * )
	 * ```
	 * @since 6.6.0
	*/ forEach<T extends Array<any>>(
		/** The Items to loop over */ items: T,
		/** The Callback for each Item */ callback: (tag: HTMLBuilder, item: T[number]) => HTMLBuilder
	) {
		items.forEach((item) => {
			const builder = new HTMLBuilder(this.route, [ ...this.fnArguments, { name: getFunctionArguments(callback)[1].replace(')', ''), value: item } ], this.getEveries, this.everyId)
			callback(builder, item)

			this.html += builder.html
		})

		return this
	}
}