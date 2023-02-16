export default class ValueCollection<Key extends string | number | symbol = string | number | symbol, Value = any> {
  private data: Record<Key, Value> = {} as any

  /** Create a New Collection */
  constructor(
    /** JSON Data to Import */ data?: Record<Key, Value>,
    /** Function to Parse Values with */ parse?: (value: any) => Value
  ) {
    data = data ?? {} as any
    parse = parse ?? ((value) => value)

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
    /** The Key to get */ key: Key
  ): Value {
    return this.data[key]
  }

  /** Set a Key */
  set(
    /** The Key to set */ key: Key,
    /** The new Value */ value: Value
  ): boolean {
    const existed = (key in this.data)
    this.data[key] = value
    return existed
  }

  /** Get The Amount of Stored Objects */
  objectCount(): number {
    return Object.keys(this.data).length
  }

  /** Clear the Stored Objects */
  clear(
    /** Excluded Keys */ excluded?: Key[]
  ): number {
    excluded = excluded ?? []

    let keys = 0
    for (const key in this.data) {
      if (excluded.includes(key)) continue
      delete this.data[key]
      keys++
    }; return keys
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
    }; return keys
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
    }; return keys
  }

  /** Loop over all Keys */
  forEach(
    /** Callback Function */ callback: (key: Key, value: Value) => any,
    /** Excluded Keys */ excluded?: Key[]
  ): number {
    callback = callback ?? (() => undefined)
    excluded = excluded ?? []

    let keys = 0
    for (const key in this.data) {
      if (excluded.includes(key)) continue
      callback(key, this.data[key])
      keys++
    }; return keys
  }
}