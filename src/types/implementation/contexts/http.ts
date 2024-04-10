import ValueCollection from "@/classes/ValueCollection"
import { CompressionAlgorithm, type Method } from "@/types/global"
import { WebsocketData } from "@/types/implementation/handle"
import { Readable } from "stream"

export abstract class HttpContext {
	private compression: CompressionAlgorithm | null = null

	public abstract aborted(): AbortSignal

	public abstract type(): 'http' | 'ws'
	public abstract method(): Method
	public abstract path(): string

	public abstract clientIP(): string
	public abstract clientPort(): number

	public abstract getHeaders(): ValueCollection<string, string>
	public abstract onBodyChunk(callback: (chunk: ArrayBuffer, isLast: boolean) => Promise<any>): Promise<void>

	public compress(algorithm: CompressionAlgorithm | null): this {
		this.compression = algorithm

		return this
	}

	public getCompression(): CompressionAlgorithm | null {
		return this.compression
	}

	public compressionHeader(chunked: boolean): this {
		if (this.compression) {
			if (chunked) this.header('transfer-encoding', 'chunked')
			this.header('content-encoding', this.compression === 'brotli' ? 'br' : this.compression)
			this.header('vary', 'Accept-Encoding')
		}

		return this
	}

	public abstract status(code: number, message: string): this
	public abstract header(key: string, value: string): this
	public abstract write(data: ArrayBuffer | Readable): Promise<void>
	public abstract writeFile(file: string, start?: number, end?: number): void
	public abstract upgrade(data: WebsocketData): boolean
}