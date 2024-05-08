import parseContent, { Content } from "@/functions/parseContent"
import { RealAny } from "@/types/internal"
import { array, as, number } from "@rjweb/utils"

type Listener<Value extends Content> = (data: Value) => RealAny

export default class Channel<Value extends Content = Content> {
	private data: Content | null
	private listeners: Listener<Value>[] = []
	protected onPublish: ((type: 'text' | 'binary', data: ArrayBuffer) => void) | null = null

	/**
	 * Create a new Channel
	 * @example
	 * ```
	 * import { Server, Channel } from "rjweb-server"
	 * import { Runtime } from "@rjweb/runtime-bun"
	 * 
	 * const echo = new Channel<string>()
	 * 
	 * const server = new Server(Runtime, {
	 *   port: 8000
	 * })
	 * 
	 * server.path('/', (path) => path
	 *   .ws('/echo', (ws) => ws
	 *     .onOpen((ctr) => {
	 *       ctr.printChannel(echo)
	 *     })
	 *     .onMessage((ctr) => {
	 *       echo.send(ctr.rawMessage()) // will send the message to all subscribed sockets
	 *     })
	 *   )
	 *   .http('GET', '/last-echo', (http) => http
	 *     .onRequest((ctr) => {
	 *       return ctr.print(echo.last())
	 *     })
	 *   )
	 * )
	 * 
	 * server.start().then(() => console.log('Server Started!'))
	 * ```
	 * @since 9.0.0
	*/ constructor(id?: number | null, initial?: Content) {
		this.data = initial ?? null
		this.id = id ?? number.generateCrypto(1, 10000000)
	}

	/**
	 * The ID of the Channel used for publishing
	 * @since 9.0.0
	*/ public readonly id: number

	/**
	 * Send Data to each Subscriber (and listener)
	 * @since 9.0.0
	*/ public async send(type: 'text' | 'binary', data: Value, prettify: boolean = false): Promise<this> {
		for (const listener of this.listeners) {
			await Promise.resolve(listener(data))
		}

		if (this.onPublish) try {
			const parsed = (await parseContent(data, prettify)).content

			if (this.onPublish) this.onPublish(type, parsed)
		} catch { }

		this.data = data

		return this
	}

	/**
	 * Get the last sent value
	 * @since 9.0.0
	*/ public last(): Value | null {
		return as<Value | null>(this.data)
	}

	/**
	 * Listen for send events on this Channel
	 * @since 9.0.0
	*/ public listen(callback: Listener<Value>): () => void {
		this.listeners.push(callback)

		return () => {
			const res = array.remove(this.listeners, 'value', callback)
			this.listeners.length = 0
			this.listeners.push(...res)
		}
	}
}