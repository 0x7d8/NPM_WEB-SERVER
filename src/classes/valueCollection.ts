import { RealAny } from "../types/internal"

export class BaseCollection<Key extends PropertyKey = PropertyKey, Value = any> {
	protected modifyFn: ((event: 'set' | 'delete' | 'clear', key: any, value: any) => any) | null = null
	protected data: Map<Key, Value> = new Map()
	protected maxElements: number
	protected allowModify: boolean

	/**
	 * Create a New Value Collection
	 * @example
	 * ```
	 * const collection = new ValueCollection()
	 * 
	 * collection
	 *   .set('name', 'beta')
	 *   .set('key', 'value')
	 * 
	 * collection.has('key') // true
	 * collection.has('ms') // false
	 * 
	 * collection.toJSON() // { name: 'beta', key: 'value' }
	 * 
	 * collection.forEach((key, value) => {
	 *   console.log(key, value)
	 * })
	 * 
	 * collection.clear(['key'])
	 * 
	 * collection.toJSON() // { key: 'value' }
	 * ```
	 * @since 2.5.0
	*/ constructor(
		/** JSON Data to Import */ data?: Record<Key, Value>,
		/** Function to Parse Values with */ parse?: (value: any) => Value,
		/** Whether to allow modifying the Values */ allowModify: boolean = true,
		/** How many Elements to store at max, when hit clear */ maxElements: number = Infinity
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
	*/ public has(
		/** The Key to check */ key: Key
	): boolean {
		return this.data.has(key)
	}

	/**
	 * Get a Key
	 * @since 2.5.0
	*/ public get<T extends Key, Fallback extends Value | undefined = undefined>(
		/** The Key to get */ key: T,
		/** The Fallback Value */ fallback?: Fallback
	): Value | Fallback {
		return this.data.get(key) ?? (fallback as any)
	}

	/**
	 * Get all Objects as JSON
	 * @since 2.5.0
	*/ public toJSON(
		/** Excluded Keys */ excluded: Key[] = []
	): Record<Key, Value> {
		let keys = {} as any
		for (const [key, value] of this.data) {
			if (excluded.includes(key)) continue
			keys[key] = value
		}

		return keys
	}

	/**
	 * Get all Values as Array
	 * @since 2.5.0
	*/ public toArray(
		/** Excluded Keys */ excluded: Key[] = []
	): Value[] {
		const values = []
		for (const [key, value] of this.data) {
			if (excluded.includes(key)) continue
			values.push(value)
		}

		return values
	}

	/**
	 * Loop over all Keys
	 * @since 2.5.0
	*/ public forEach(
		/** Callback Function */ callback: (key: Key, value: Value, index: number) => RealAny,
		/** Excluded Keys */ excluded: Key[] = []
	): this {
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
		return this.data.entries()
	}

	/**
	 * Get the Entries of this Value Collection
	 * @since 6.0.3
	*/ public entries(
		/** Excluded Keys */ excluded: Key[] = []
	): [Key, Value][] {
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
		/** Callback Function */ callback: Callback,
		/** Excluded Keys */ excluded: Key[] = []
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
	*/ public get objectCount(): number {
		return this.data.size
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
	*/ public set(
		/** The Key to set */ key: Key,
		/** The new Value */ value: SetValue
	): this {
		if (!this.allowModify) return this

		if (this.objectCount > this.maxElements) this.clear()

		if (this.modifyFn) this.modifyFn('set', key, value)
		else this.data.set(key, value as any)

		return this
	}

	/**
	 * Delete a Key
	 * @since 8.0.0
	*/ public delete(
		/** The Key to delete */ key: Key
	): this {
		if (!this.allowModify) return this

		if (this.objectCount > this.maxElements) this.clear()

		if (this.modifyFn) this.modifyFn('delete', key, null)
		else this.data.delete(key)

		return this
	}

	/**
	 * Clear the Stored Objects
	 * @since 3.0.0
	*/ public clear(
		/** Excluded Keys */ excluded: Key[] = []
	): number {
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
}