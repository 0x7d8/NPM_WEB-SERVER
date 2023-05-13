const normalize = <Object extends Array<any>>(o: Object): Object => o ?? []

export default class MiniEventEmitter<Events extends Record<string, (...args: any) => any>> {
	protected listeners: Record<keyof Events, Function[]> = {} as any

	/**
	 * Listen for an Event
	 * @since 7.7.0
	*/ public listen<Event extends keyof Events>(event: Event, callback: Events[Event]): this {
		this.listeners[event] = normalize(this.listeners[event])
		this.listeners[event].push(callback)

		return this
	}

	/**
	 * Remove a listener
	 * @since 7.7.0
	*/ public unlist<Event extends keyof Events>(event: Event, callback: Events[Event]): this {
		this.listeners[event] = this.listeners[event].filter((e) => Object.is(e, callback))

		return this
	}

	/**
	 * Send (Emit) an Event
	 * @since 7.7.0
	*/ public async send<Event extends keyof Events>(event: Event, ...args: Parameters<Events[Event]>): Promise<(Awaited<ReturnType<Events[Event]>> | Error)[]> {
		this.listeners[event] = normalize(this.listeners[event])
		const returns: Awaited<ReturnType<Events[Event]>>[] = []

		for (const callback of this.listeners[event]) {
			try {
				const res = await Promise.resolve(callback(...args as any))

				returns.push(res)
			} catch (err: any) {
				returns.push(err)
				break
			}
		}

		return returns
	}
}