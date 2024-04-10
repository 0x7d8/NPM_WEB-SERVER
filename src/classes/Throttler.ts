export default class Throttler {
	constructor(bytes: number) {
		this.bytes = bytes
	}

	private sent = 0
	private lastSent = Date.now()

	/**
	 * The Bytes that are allowed to be sent each second
	 * @since 9.0.0
	*/ public readonly bytes: number

	/**
	 * Insert Data into the Throttler and wait for it to be sent
	 * @since 9.0.0
	*/ public async insert(data: ArrayBuffer | Buffer | Uint8Array): Promise<void> {
		const now = Date.now()

		if (now - this.lastSent >= 1000) {
			this.sent = data.byteLength
			this.lastSent = now
		} else {
			if (this.sent + data.byteLength > this.bytes) {
				await new Promise((resolve) => setTimeout(resolve, 1000 - (now - this.lastSent)))
				this.sent = data.byteLength
			} else {
				this.sent += data.byteLength
			}
		}
	}
}