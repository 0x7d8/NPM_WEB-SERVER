import parsePath from "../functions/parsePath"
import { isRegExp } from "util/types"
import ValueCollection from "./valueCollection"
import { HTTPMethods } from "../types/external"

type Segment = {
	raw: string
	paramsRegExp: RegExp
	params: string[]
}

type Data = {
	type: 'regexp'
	value: RegExp
	prefix: string
	segments: Segment[]
} | {
	type: 'normal'
	value: string
	segments: Segment[]
}

/**
 * A Utility to make checking paths safer
 * @since 8.4.0
*/ export default class Path {
	public data: Data

	/**
	 * Create a new Path object
	 * @since 8.4.0
	*/ constructor(public method: HTTPMethods, public path: string | RegExp) {
		if (isRegExp(path)) {
			this.data = {
        type: 'regexp',
        value: path,
				prefix: '/',
        segments: [{
					raw: '',
          paramsRegExp: new RegExp(''),
          params: []
				}, {
					raw: '',
          paramsRegExp: new RegExp(''),
          params: []
				}]
      }
		} else if (typeof path === 'string') {
			const segments = parsePath(path).split('/')

			this.data = {
				type: 'normal',
				value: segments.join('/'),
				segments: []
			}

			for (const segment of segments) {
				this.data.segments.push({
					raw: segment,
          paramsRegExp: new RegExp(segment.replace(/{([^}]+)}/g, '(.*\\S)')),
          params: (segment.match(/{([^}]+)}/g) ?? []).map((m) => m.slice(1, -1))
				})
			}
		} else {
			throw new Error(`Invalid Path (${typeof path})`)
		}
	}

	/**
	 * Add a Prefix to the Path
	 * @since 8.4.0
	*/ public addPrefix(prefix: string): this {
		switch (this.data.type) {
			case "normal": {
				const segments = parsePath([ prefix, this.data.value ]).split('/')
				
				this.path = segments.join('/')
				this.data = {
					type: 'normal',
					value: segments.join('/'),
					segments: []
				}

				for (const segment of segments) {
					this.data.segments.push({
						raw: segment,
						paramsRegExp: new RegExp(segment.replace(/{([^}]+)}/g, '(.*\\S)')),
						params: (segment.match(/{([^}]+)}/g) ?? []).map((m) => m.slice(1, -1))
					})
				}

				break
			}

			case "regexp": {
				const segments = parsePath([ prefix, this.data.prefix ]).split('/')

				this.data = {
					type: 'regexp',
					value: this.data.value,
					prefix: segments.join('/'),
					segments: []
				}

				for (const segment of segments) {
					this.data.segments.push({
						raw: segment,
						paramsRegExp: new RegExp(segment.replace(/{([^}]+)}/g, '(.*\\S)')),
						params: (segment.match(/{([^}]+)}/g) ?? []).map((m) => m.slice(1, -1))
					})
				}

				break
			}
		}

		return this
	}

	/**
	 * Add a Suffix to the Path
	 * @since 8.4.0
	*/ public addSuffix(prefix: string): this {
		switch (this.data.type) {
			case "normal": {
				const segments = parsePath([ this.data.value, prefix ]).split('/')
				
				this.path = segments.join('/')
				this.data = {
					type: 'normal',
					value: segments.join('/'),
					segments: []
				}

				for (const segment of segments) {
					this.data.segments.push({
						raw: segment,
						paramsRegExp: new RegExp(segment.replace(/{([^}]+)}/g, '(.*\\S)')),
						params: (segment.match(/{([^}]+)}/g) ?? []).map((m) => m.slice(1, -1))
					})
				}

				break
			}

			case "regexp": {
				const segments = parsePath([ this.data.prefix, prefix ]).split('/')

				this.data = {
					type: 'regexp',
					value: this.data.value,
					prefix: segments.join('/'),
					segments: []
				}

				for (const segment of segments) {
					this.data.segments.push({
						raw: segment,
						paramsRegExp: new RegExp(segment.replace(/{([^}]+)}/g, '(.*\\S)')),
						params: (segment.match(/{([^}]+)}/g) ?? []).map((m) => m.slice(1, -1))
					})
				}

				break
			}
		}

		return this
	}

	/**
	 * Test the Path against the Request Path
	 * @since 8.4.0
	*/ public matches(method: HTTPMethods, collection: ValueCollection, requestPath: string, requestPathSplit: string[]): boolean {
		if (this.method !== method) return false
		if (this.data.type === 'normal' && this.data.segments.length !== requestPathSplit.length) return false
		if (this.data.type === 'regexp' && !this.data.value.test(parsePath(requestPath.replace(this.data.prefix, '')))) return false

		let found = false

		for (let i = 1; i < requestPathSplit.length; i++) {
			const reqSegment = requestPathSplit[i], segment = this.data.segments[i]

			if (!segment) {
				if (this.data.type === 'normal') break

				found = true
				break
			}

			if (segment.params.length === 0) {
				if (segment.raw === reqSegment) {
					if (i === requestPathSplit.length - 1 && this.data.type === 'normal') {
						found = true
						break
					}
				} else break
			}

			const params = reqSegment.match(segment.paramsRegExp)
			if (params) {
				if (i === requestPathSplit.length - 1) found = true

				for (let i = 0; i < segment.params.length; i++) {
					collection.set(segment.params[i], params[i + 1])
				}
			} else break
		}

		return found
	}
}