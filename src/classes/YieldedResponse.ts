export default class YieldedResponse<Data = unknown> {
	constructor(private _data: Data) {}

	/**
	 * Get the Response Data of the Yielded Response
	 * @since 9.2.0
	*/ public data(): Data {
		return this._data
	}
}