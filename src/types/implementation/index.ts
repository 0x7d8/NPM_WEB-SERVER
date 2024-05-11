import { FullServerOptions } from "@/types/structures/ServerOptions"
import { HandleRecord } from "@/types/implementation/handle"

export abstract class Implementation {
	public readonly options: FullServerOptions

	constructor(options: FullServerOptions) {
		this.options = options
	}

	public abstract name(): string
	public abstract version(): string
	public abstract start(): Promise<void>
	public abstract stop(): void
	public abstract port(): number

	public abstract handle(handlers: { [key in keyof HandleRecord]: (context: HandleRecord[key]) => Promise<any> }): void
	public abstract wsPublish(type: 'text' | 'binary', id: number, data: ArrayBuffer, compressed: boolean): void
}

export type BaseImplementation = new(options: any) => Implementation