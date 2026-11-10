import type ValueCollection from "@/classes/ValueCollection"
import type { CompressionAlgorithm, Method } from "@/types/global"
import type { WebsocketData } from "@/types/implementation/handle"
import type { Readable } from "stream"

export abstract class HttpContext {
	private compression: CompressionAlgorithm | null = null

	public abstract aborted(): AbortSignal

	/**
	 * Whether the Request was aborted, override this when it can be answered without creating an AbortSignal
	 * @since 9.9.1
	*/ public isAborted(): boolean {
		return this.aborted().aborted
	}

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
		}

		return this
	}

	public abstract status(code: number, message: string): this
	public abstract header(key: string, value: string): this
	public abstract write(data: ArrayBuffer | Readable): Promise<void>
	/**
	 * Write a File as the response, `start` and `end` are both inclusive byte offsets and undefined for the whole file,
	 * `stat` is passed when the file was already checked so the runtime can skip doing so itself
	 * @since 9.0.0
	*/ public abstract writeFile(file: string, start?: number, end?: number, stat?: { size: number, mtimeMs: number, ino: number }): void
	public abstract upgrade(data: WebsocketData): boolean
}