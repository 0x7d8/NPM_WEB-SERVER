export default class valueCollection<Key extends string | number | symbol = string | number | symbol, Value = any> {
    private data;
    /** Create a New Collection */
    constructor(
    /** JSON Data to Import */ data?: Record<Key, Value>, 
    /** Function to Parse Values with */ parse?: (value: any) => Value);
    /** Check if a Key exists */
    has(
    /** The Key to check */ key: Key): boolean;
    /** Get a Key */
    get(
    /** The Key to get */ key: Key): Value;
    /** Set a Key */
    set(
    /** The Key to set */ key: Key, 
    /** The new Value */ value: Value): boolean;
    /** Get The Amount of Stored Objects */
    objectCount(): number;
    /** Get all Keys as JSON */
    toJSON(
    /** Excluded Keys */ excluded?: Key[]): Record<Key, Value>;
    /** Get all Keys as Array */
    toArray(
    /** Excluded Keys */ excluded?: Key[]): Value[];
    /** Loop over all Keys */
    forEach(
    /** Callback Function */ callback: (key: Key, value: Value) => any, 
    /** Excluded Keys */ excluded?: Key[]): number;
}
