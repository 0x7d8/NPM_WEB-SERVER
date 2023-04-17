import { RealAny } from "../types/internal"

export default class ValueCollection<Key extends string | number | symbol = string | number | symbol, Value = any> {
	public data: Record<Key, Value> = {} as any
	public allowModify: boolean

	/**
	 * Create a New Value Collection
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
	*/ has(
		/** The Key to check */ key: Key
	): boolean {
		return (key in this.data)
	}

	/**
	 * Get a Key
	 * @since 2.5.0
	*/ get<T extends Key, Fallback extends Value | undefined = undefined>(
		/** The Key to get */ key: T,
		/** The Fallback Value */ fallback?: Fallback
	): this['data'][T] | Fallback {
		return this.data[key] ?? (fallback as any)
	}

	/**
	 * Set a Key
	 * @since 2.5.0
	*/ set(
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
	*/ clear(
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
	*/ toJSON(
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
	*/ toArray(
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
	*/ forEach(
		/** Callback Function */ callback: (key: Key, value: Value, index: number) => RealAny,
		/** Excluded Keys */ excluded: Key[] = []
	) {
		callback = callback ?? (() => undefined)

		{(Object.keys(this.data) as Key[])
			.filter((key) => !excluded.includes(key))
			.forEach((key, index) => callback(key, this.data[key], index))}

		return this
	}

	/**
	 * Get the Entries of this Value Collection
	 * @since 6.0.3
	*/ entries(
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
	*/ map(
		/** Callback Function */ callback: (key: Key, value: Value, index: number, data: Record<Key, Value>) => any,
		/** Excluded Keys */ excluded: Key[] = []
	): any[] {
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
	*/ get objectCount(): number {
		return Object.keys(this.data).length
	}
}