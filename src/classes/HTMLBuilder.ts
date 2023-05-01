import HTTPRequest from "./web/HttpRequest"
import HTMLTag from "../types/htmlTag"
import { RealAny } from "../types/internal"
import { hashStr } from "rjutils-collection"
import HTMLComponent from "./HTMLComponent"

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
	getter(ctr: HTTPRequest): RealAny
	callback(tag: HTMLBuilder, data: any): HTMLBuilder
	fnArguments: FnArgument[]
}

interface HTMLAttributeRecord extends Record<string, HTMLAttribute> { }

const f = (attribute: string): string => {
	const replace: Record<string, string> = {
		'"': '&quot;',
		'\n': '&#xa'
	}

	return attribute.replace(/["]|\n/g, (m) => replace[m])
}

const fF = (fn: Function): string => {
	let fnString = fn.toString()
	let addStart = '', addEnd = '}'

	fnString = fnString
		.replace('async', () => {
			addStart += 'async'
			return ''
		})
		.replace('=>', () => {
			addStart += ' function'
			return '{'
		})
	
	return addStart + fnString + addEnd
}

const fH = (text: string): string => {
  const replace: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    '\'': '&#039;'
  }
  
  return text.replace(/[&<>"']/g, (m) => replace[m])
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
	const result: string[] = []

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

		result.push(`${key.replace(/"/g, '')}="${value}"`)
	})

	return result.join(' ')
}

export default class HTMLBuilder {
	protected html = ''
	protected fnArguments: FnArgument[]
	protected getEveries: GetEvery[]
	private route: string
	private everyId: { n: number }

	constructor(route: string, fnArguments: FnArgument[] = [], getEvery: GetEvery[] = [], everyId: { n: number } = { n: 0 }) {
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
	*/ public t(
		/** The HTML Tag name */ tag: HTMLTag,
		/** The HTML Attributes to add */ attributes: Record<string, HTMLAttribute>,
		/** The Callback or Content to escape */ callback: ((tag: HTMLBuilder) => HTMLBuilder) | HTMLContent | HTMLComponent
	): this {
		this.html += `<${tag} ${parseAttributes(attributes, this.fnArguments)}>`

		if (typeof callback === 'function') {
			const builder = new HTMLBuilder(this.route, [ ...this.fnArguments ], this.getEveries, this.everyId)

			callback(builder)
			this.html += builder.html
		} else {
			this.html += fH(String(callback))
		}

		this.html += `</${tag}>`
		return this
	}

	/**
	 * Add a new HTML Component
	 * @example
	 * ```
	 * const component = new HTMLComponent((html, options) => html
	 *   .t('p', {}, options?.hello)
	 * )
	 * 
	 * ctr.printHTML((html) => html
	 *   .t('div', {}, (t) => t
	 *     .t('p', {}, (t) => t
	 *       .raw('hello world!')
	 *     )
	 *     .c(component, { hello: 'Hello world!' })
	 *   )
	 * )
	 * ```
	 * @since 6.7.0
	*/ public c<Component extends HTMLComponent>(
		/** The Component Object */ component: Component,
		/** The Options to add */ options?: Component extends HTMLComponent<infer Options> ? Options : never
	): this {
		const builder = (component as any).toBuilder(this.route, options) as HTMLBuilder
		this.html += builder.html

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
	*/ public raw(
		/** The Raw Content to add */ content: HTMLContent
	): this {
		this.html += content

		return this
	}

	/**
	 * Add escaped Content
	 * @example
	 * ```
	 * ctr.printHTML((html) => html
	 *   .t('div', {}, (t) => t
	 *     .t('p', {}, (t) => t
	 *       .escaped('hello world!')
	 *     )
	 *   )
	 * )
	 * ```
	 * @since 6.6.2
	*/ public escaped(
		/** The Raw Content to add */ content: HTMLContent
	): this {
		this.html += fH(String(content))

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
	*/ public var(
		/** The Variables as Object */ variables: Record<string, any>
	): this {
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
	*/ public if(
		/** The Boolean to check */ state: boolean,
		/** The Callback for when the Boolean is truthy */ callback: ((tag: HTMLBuilder) => HTMLBuilder) | HTMLContent | HTMLComponent
	): this {
		if (state) {
			if (typeof callback === 'function') {
				const builder = new HTMLBuilder(this.route, [ ...this.fnArguments ], this.getEveries, this.everyId)

				callback(builder)
				this.html += builder.html
			} else {
				this.html += String(callback)
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
	 *     .forEach(numbers, (t, number) => t
	 *       .if(number > 0.5, (t) => t
	 *         .t('h1', {}, 'Number is bigger than 0.5!')
	 *       )
	 *       .t('p', {}, (t) => t
	 *         .raw(`Crazy Number: ${number}`)
	 *       )
	 *     )
	 *   )
	 * )
	 * ```
	 * @since 6.6.0
	*/ public getEvery<T extends (ctr: HTTPRequest) => RealAny>(
		/** The Function to get Data */ getter: T,
		/** The Interval for Iterations (ms) */ interval: number,
		/** The Callback for each Iteration */ callback: (tag: HTMLBuilder, item: Awaited<ReturnType<T>>) => HTMLBuilder
	): this {
		const id = `${this.route.replace('/', '-')}___rId___${this.everyId.n++}___${hashStr({ text: callback.toString(), algorithm: 'sha1' })}`

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
	*/ public forEach<T extends Array<any>>(
		/** The Items to loop over */ items: T,
		/** The Callback for each Item */ callback: (tag: HTMLBuilder, item: T[number]) => HTMLBuilder
	): this {
		items.forEach((item) => {
			const builder = new HTMLBuilder(this.route, [ ...this.fnArguments, { name: getFunctionArguments(callback)[1].replace(')', ''), value: item } ], this.getEveries, this.everyId)
			callback(builder, item)

			this.html += builder.html
		})

		return this
	}
}