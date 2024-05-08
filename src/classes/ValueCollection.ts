import { RealAny } from "@/types/internal"

const inspectSymbol = Symbol.for('nodejs.util.inspect.custom')

export class BaseCollection<Key extends PropertyKey = PropertyKey, Value = any> {
	protected modifyFn: ((event: 'set' | 'delete' | 'clear', key: any, value: any) => any) | null = null
	protected data: Map<Key, Value> = new Map()
	protected maxElements: number
	protected allowModify: boolean

	/**
	 * Create a new Value Collection
	 * @example
	 * ```
	 * import { ValueCollection } from "rjweb-server"
	 * 
	 * const collection = new ValueCollection()
	 * 
	 * collection
	 *   .set('name', 'beta')
	 *   .set('key', 'value')
	 * 
	 * collection.has('key') // true
	 * collection.has('ms') // false
	 * 
	 * collection.json() // { name: 'beta', key: 'value' }
	 * 
	 * for (const [ key, value ] of collection) {
	 *   console.log(key, value)
	 * }
	 * 
	 * collection.clear(['key'])
	 * 
	 * collection.json() // { key: 'value' }
	 * ```
	 * @since 2.5.0
	*/ constructor(
		data?: Record<Key, Value>,
		parse?: (value: any) => Value,
		allowModify: boolean = true,
		maxElements: number = Infinity
	) {
		data = data ?? {} as any
		parse = parse ?? ((value) => value)
		this.maxElements = maxElements
		this.allowModify = allowModify
	
		for (const key in data) {
			this.data.set(key, parse(data[key]))
		}
	}


	/**
	 * Check if a Key exists
	 * @since 2.5.0
	*/ public has(key: Key): boolean {
		return this.data.has(key)
	}

	/**
	 * Get a Key
	 * @since 2.5.0
	*/ public get<Fallback extends Value | null = null>(key: Key, fallback?: Fallback): Value | Fallback {
		return this.data.get(key) ?? (fallback as any)
	}

	/**
	 * Search for a Key
	 * @since 9.3.0
	*/ public search(
		callback: (key: Key, value: Value, index: number) => boolean
	): [Key, Value] | null {
		let index = 0
		for (const [ key, value ] of this.data) {
			if (callback(key, value, index++)) return [ key, value ]
		}

		return null
	}

	/**
	 * Get all Objects as JSON
	 * @since 2.5.0
	 * @deprecated use `.json()` instead
	*/ public toJSON(excluded: Key[] = []): Record<Key, Value> {
		return this.json(excluded)
	}

	/**
	 * Get the Data of this Collection as JSON
	 * @since 9.3.0
	*/ public json(excluded: Key[] = []): Record<Key, Value> {
		let keys = {} as any
		for (const [ key, value ] of this.data) {
			if (excluded.includes(key)) continue
			keys[key] = value
		}

		return keys
	}

	/**
	 * Get all Values as Array
	 * @since 2.5.0
	 * @deprecated use `.values()` instead
	*/ public toArray(excluded: Key[] = []): Value[] {
		return this.values(excluded)
	}

	/**
	 * Get the Values of this Collection
	 * @since 9.3.0
	*/ public values(excluded: Key[] = []): Value[] {
		const values: Value[] = []
		for (const [ key, value ] of this.data) {
			if (excluded.includes(key)) continue
			values.push(value)
		}

		return values
	}

	/**
	 * Get the Keys of this Collection
	 * @since 9.3.0
	*/ public keys(excluded: Key[] = []): Key[] {
		const keys: Key[] = []
		for (const [ key ] of this.data) {
			if (excluded.includes(key)) continue
			keys.push(key)
		}

		return keys
	}

	/**
	 * Loop over all Keys
	 * @since 2.5.0
	*/ public forEach(callback: (key: Key, value: Value, index: number) => RealAny, excluded: Key[] = []): this {
		callback = callback ?? (() => undefined)

		let index = 0
		this.data.forEach((value, key) => {
			if (excluded.includes(key)) return

			callback(key, value, index++)
		})

		return this
	}

	/**
	 * Object Iterator (similar to .forEach() but can be used in for ... of loops)
	 * @since 7.7.0
	*/ public [Symbol.iterator](): Iterator<[ Key, Value ]> {
		return this.data[Symbol.iterator]()
	}

	/**
	 * Get the Entries of this Collection
	 * @since 6.0.3
	*/ public entries(excluded: Key[] = []): [Key, Value][] {
		const entries: [Key, Value][] = []
		
		this.data.forEach((value, key) => {
			if (excluded.includes(key)) return

			entries.push([ key, value ])
		})

		return entries
	}

	/**
	 * Map the Keys to a new Array
	 * @since 5.3.1
	*/ public map<Callback extends (key: Key, value: Value, index: number, data: this) => RealAny>(
		callback: Callback,
		excluded: Key[] = []
	): ReturnType<Callback>[] {
		callback = callback ?? ((value) => value)
		const result: ReturnType<Callback>[] = []

		let index = 0
		this.data.forEach((value, key) => {
			if (excluded.includes(key)) return

			result.push(callback(key, value, index++, this))
		})

		return result
	}

	/**
	 * The Amount of Stored Objects
	 * @since 2.7.2
	 * @deprecated use `.size()` instead
	*/ public get objectCount(): number {
		return this.data.size
	}

	/**
	 * Get the Size of this Collection
	 * @since 9.3.0
	*/ public size(): number {
		return this.data.size
	}

	[inspectSymbol](): string {
		return `<ValueCollection (${this.data.size})>`
	}
}

/**
 * A Key - Value Store with easy access functions
 * @example
 * ```
 * const collection = new ValueCollection(...)
 * ```
 * @since 2.5.0
*/ export default class ValueCollection<Key extends PropertyKey = PropertyKey, Value = any, SetValue = Value> extends BaseCollection<Key, Value> {
	/**
	 * Set a Key
	 * @since 2.5.0
	*/ public set(key: Key, value: SetValue): this {
		if (!this.allowModify) return this

		if (this.data.size > this.maxElements) this.clear()

		if (this.modifyFn) this.modifyFn('set', key, value)
		else this.data.set(key, value as any)

		return this
	}

	/**
	 * Delete a Key
	 * @since 8.0.0
	*/ public delete(key: Key): this {
		if (!this.allowModify) return this

		if (this.data.size > this.maxElements) this.clear()

		if (this.modifyFn) this.modifyFn('delete', key, null)
		else this.data.delete(key)

		return this
	}

	/**
	 * Clear the Stored Objects
	 * @since 3.0.0
	*/ public clear(excluded: Key[] = []): number {
		if (!this.allowModify) return 0

		let keys = 0
		if (this.modifyFn) keys = this.modifyFn('clear', excluded, null)
		else for (const [key] of this.data) {
			if (excluded.includes(key)) continue
			this.data.delete(key)
			keys++
		}

		return keys
	}

	/**
	 * Import another Value Collection into this one
	 * @since 9.0.0
	*/ public import(data: ValueCollection<Key, SetValue, any> | Map<Key, SetValue> | IterableIterator<[Key, SetValue]>): this {
		if (!this.allowModify) return this

		for (const [ key, value ] of data) {
			this.set(key, value)
		}

		return this
	}
}