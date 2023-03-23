export default class ValueCollection<Key extends string | number | symbol = string | number | symbol, Value = any> {
	private data: Record<Key, Value> = {} as any
	private allowModify: boolean

	/** Create a New Collection */
	constructor(
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

	/** Check if a Key exists */
	has(
		/** The Key to check */ key: Key
	): boolean {
		return (key in this.data)
	}

	/** Get a Key */
	get(
		/** The Key to get */ key: Key,
		/** The Fallback Value */ fallback?: Value
	): Value | undefined {
		return this.data[key] ?? fallback
	}

	/** Set a Key */
	set(
		/** The Key to set */ key: Key,
		/** The new Value */ value: Value
	): boolean {
		const existed = (key in this.data)
		if (!this.allowModify) return existed

		this.data[key] = value

		return existed
	}

	/** Clear the Stored Objects */
	clear(
		/** Excluded Keys */ excluded?: Key[]
	): number {
		excluded = excluded ?? []
		if (!this.allowModify) return 0

		let keys = 0
		for (const key in this.data) {
			if (excluded.includes(key)) continue
			this.data[key] = undefined
			keys++
		}

		return keys
	}

	/** Get all Objects as JSON */
	toJSON(
		/** Excluded Keys */ excluded?: Key[]
	): Record<Key, Value> {
		excluded = excluded ?? []

		let keys = {} as any
		for (const key in this.data) {
			if (excluded.includes(key)) continue
			keys[key] = this.data[key]
		}

		return keys
	}

	/** Get all Values as Array */
	toArray(
		/** Excluded Keys */ excluded?: Key[]
	): Value[] {
		excluded = excluded ?? []

		let keys = [] as any
		for (const key in this.data) {
			if (excluded.includes(key)) continue
			keys.push(this.data[key])
		}

		return keys
	}

	/** Loop over all Keys */
	forEach(
		/** Callback Function */ callback: (key: Key, value: Value, index: number) => Promise<any> | any,
		/** Excluded Keys */ excluded?: Key[]
	) {
		callback = callback ?? (() => undefined)
		excluded = excluded ?? []

		{(Object.keys(this.data) as Key[])
			.filter((key) => !excluded.includes(key))
			.forEach((key, index) => callback(key, this.data[key], index))}

		return this
	}

	/** Map the Keys to a new Array */
	map(
		/** Callback Function */ callback: (key: Key, value: Value, index: number, data: Record<Key, Value>) => any,
		/** Excluded Keys */ excluded?: Key[]
	): any[] {
		callback = callback ?? ((value) => value)
		excluded = excluded ?? []

		let sortedData = Object.assign({}, this.data)
		for (const key in sortedData) {
			if (excluded.includes(key)) sortedData[key] = undefined
		}

		return (Object.keys(this.data) as Key[])
			.filter((key) => !excluded.includes(key))
			.map((key, index) => callback(key, this.data[key], index, sortedData))
	}

	/** Get The Amount of Stored Objects */
	get objectCount(): number {
		return Object.keys(this.data).length
	}
}