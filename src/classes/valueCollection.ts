import { RealAny } from "../types/internal"

/**
 * A Key - Value Store with easy access functions
 * @example
 * ```
 * const collection = new ValueCollection(...)
 * ```
 * @since 2.5.0
*/ export default class ValueCollection<Key extends string | number | symbol = string | number | symbol, Value = any> {
	protected data: Record<Key, Value> = {} as any
	public allowModify: boolean

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
		/** Whether to allow modifying the Values */ allowModify: boolean = true
	) {
		data = data ?? {} as any
		parse = parse ?? ((value) => value)
		this.allowModify = allowModify

		for (const key in data) {
			this.data[key] = parse(data[key])
		}
	}

	/**
	 * Check if a Key exists
	 * @since 2.5.0
	*/ public has(
		/** The Key to check */ key: Key
	): boolean {
		return (key in this.data)
	}

	/**
	 * Get a Key
	 * @since 2.5.0
	*/ public get<T extends Key, Fallback extends Value | undefined = undefined>(
		/** The Key to get */ key: T,
		/** The Fallback Value */ fallback?: Fallback
	): Value | Fallback {
		return this.data[key] ?? (fallback as any)
	}

	/**
	 * Set a Key
	 * @since 2.5.0
	*/ public set(
		/** The Key to set */ key: Key,
		/** The new Value */ value: Value
	): boolean {
		const existed = (key in this.data)
		if (!this.allowModify) return existed

		this.data[key] = value

		return existed
	}

	/**
	 * Clear the Stored Objects
	 * @since 3.0.0
	*/ public clear(
		/** Excluded Keys */ excluded: Key[] = []
	): number {
		if (!this.allowModify) return 0

		let keys = 0
		for (const key in this.data) {
			if (excluded.includes(key)) continue
			delete this.data[key]
			keys++
		}

		return keys
	}

	/**
	 * Get all Objects as JSON
	 * @since 2.5.0
	*/ public toJSON(
		/** Excluded Keys */ excluded: Key[] = []
	): Record<Key, Value> {
		let keys = {} as any
		for (const key in this.data) {
			if (excluded.includes(key)) continue
			keys[key] = this.data[key]
		}

		return keys
	}

	/**
	 * Get all Values as Array
	 * @since 2.5.0
	*/ public toArray(
		/** Excluded Keys */ excluded: Key[] = []
	): Value[] {
		const keys = []
		for (const key in this.data) {
			if (excluded.includes(key)) continue
			keys.push(this.data[key])
		}

		return keys
	}

	/**
	 * Loop over all Keys
	 * @since 2.5.0
	*/ public forEach(
		/** Callback Function */ callback: (key: Key, value: Value, index: number) => RealAny,
		/** Excluded Keys */ excluded: Key[] = []
	): this {
		callback = callback ?? (() => undefined)

		{(Object.keys(this.data) as Key[])
			.filter((key) => !excluded.includes(key))
			.forEach((key, index) => callback(key, this.data[key], index))}

		return this
	}

	/**
	 * Object Iterator (similar to .forEach() but can be used in for ... of loops)
	 * @since 7.7.0
	*/ public [Symbol.iterator](): Iterator<[ Key, Value ]> {
		const object = Object.entries(this.data)
		let index = -1

		return {
			next: () => {
				index++

				return {
					value: [object[index]?.at(0) as Key, object[index]?.at(1) as Value],
					done: object.length <= index
				}
			}
		}
	}

	/**
	 * Get the Entries of this Value Collection
	 * @since 6.0.3
	*/ public entries(
		/** Excluded Keys */ excluded: Key[] = []
	) {
		const sortedData: Record<Key, Value> = Object.assign({}, this.data)
		for (const key in sortedData) {
			if (excluded.includes(key)) delete sortedData[key]
		}

		return (Object.keys(sortedData) as Key[]).map((key) => [ key, sortedData[key] ])
	}

	/**
	 * Map the Keys to a new Array
	 * @since 5.3.1
	*/ public map<Callback extends (key: Key, value: Value, index: number, data: Record<Key, Value>) => RealAny>(
		/** Callback Function */ callback: Callback,
		/** Excluded Keys */ excluded: Key[] = []
	): ReturnType<Callback>[] {
		callback = callback ?? ((value) => value)

		const sortedData = Object.assign({}, this.data)
		for (const key in sortedData) {
			if (excluded.includes(key)) delete sortedData[key]
		}

		return (Object.keys(this.data) as Key[])
			.filter((key) => !excluded.includes(key))
			.map((key, index) => callback(key, this.data[key], index, sortedData))
	}

	/**
	 * The Amount of Stored Objects
	 * @since 2.7.2
	*/ public get objectCount(): number {
		return Object.keys(this.data).length
	}
}