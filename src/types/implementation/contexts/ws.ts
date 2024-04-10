import { WebsocketData } from "@/types/implementation/handle"

export abstract class WsContext {
	public abstract type(): 'open' | 'message' | 'close'

	public abstract write(type: 'text' | 'binary', data: ArrayBuffer, compressed: boolean): void
	public abstract close(code?: number, reason?: string): void

	public abstract message(): ArrayBuffer | Buffer | string
	public abstract messageType(): 'text' | 'binary'

	public abstract subscribe(id: number): void
	public abstract unsubscribe(id: number): void

	public abstract data(): WebsocketData
}