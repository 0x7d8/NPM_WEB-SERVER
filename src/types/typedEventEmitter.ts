export default interface TypedEventEmitter<Events extends Record<string, (...args: any[]) => void>> {
	/**
	 * Listen to an event
	 * @example
	 * ```
	 * // We will log every time a request is made
	 * const controller = new Server({ })
	 * 
	 * controller.addListener('httpRequest', (ctr) => {
	 *   console.log(`${ctr.url.method} Request made to ${ctr.url.path}`)
	 * })
	 * ```
	 * @since 6.0.0
	*/ addListener<E extends keyof Events>(event: E, listener: Events[E]): this
	/**
	 * Listen to an event
	 * @example
	 * ```
	 * // We will log every time a request is made
	 * const controller = new Server({ })
	 * 
	 * controller.on('httpRequest', (ctr) => {
	 *   console.log(`${ctr.url.method} Request made to ${ctr.url.path}`)
	 * })
	 * ```
	 * @since 6.0.0
	*/ on<E extends keyof Events>(event: E, listener: Events[E]): this
	/**
	 * Listen to an event once
	 * @example
	 * ```
	 * // We will log when a request is made once
	 * const controller = new Server({ })
	 * 
	 * controller.once('httpRequest', (ctr) => {
	 *   console.log(`${ctr.url.method} Request made to ${ctr.url.path}`)
	 * })
	 * ```
	 * @since 6.0.0
	*/ once<E extends keyof Events>(event: E, listener: Events[E]): this
	/**
	 * Listen to an event
	 * @example
	 * ```
	 * // We will log every time a request is made
	 * const controller = new Server({ })
	 * 
	 * controller.prependListener('httpRequest', (ctr) => {
	 *   console.log(`${ctr.url.method} Request made to ${ctr.url.path}`)
	 * })
	 * ```
	 * @since 6.0.0
	*/ prependListener<E extends keyof Events>(event: E, listener: Events[E]): this
	/**
	 * Listen to an event once
	 * @example
	 * ```
	 * // We will log when a request is made once
	 * const controller = new Server({ })
	 * 
	 * controller.prependOnceListener('httpRequest', (ctr) => {
	 *   console.log(`${ctr.url.method} Request made to ${ctr.url.path}`)
	 * })
	 * ```
	 * @since 6.0.0
	*/ prependOnceListener<E extends keyof Events>(event: E, listener: Events[E]): this

	 /**
	 * Remove a Listener
	 * @example
	 * ```
	 * // We will remove the first http request listener
	 * const controller = new Server({ })
	 * 
	 * controller.off('httpRequest')
	 * ```
	 * @since 6.0.0
	*/ off<E extends keyof Events>(event: E, listener: Events[E]): this
	/**
	 * Remove all listeners for a given event
	 * @example
	 * ```
	 * // We will remove all http request listeners
	 * const controller = new Server({ })
	 * 
	 * controller.removeAllListeners('httpRequest')
	 * ```
	 * @since 6.0.0
	*/ removeAllListeners<E extends keyof Events>(event?: E): this
	/**
	 * Remove a Listener
	 * @example
	 * ```
	 * // We will remove the first http request listener
	 * const controller = new Server({ })
	 * 
	 * controller.removeListener('httpRequest')
	 * ```
	 * @since 6.0.0
	*/ removeListener<E extends keyof Events>(event: E, listener: Events[E]): this

	/**
	 * Emit an Event manually
	 * @example
	 * ```
	 * // We will emit a custom event
	 * const controller = new Server({ })
	 * 
	 * controller.emit('httpRequest', ctr)
	 * ```
	 * @since 6.0.0
	*/ emit<E extends keyof Events> (event: E, ...args: Parameters<Events[E]>): boolean
	/**
	 * Emit an Event manually (with Error handling & Async Await)
	 * @example
	 * ```
	 * // We will emit a custom event
	 * const controller = new Server({ })
	 * 
	 * await controller.emitSafe('httpRequest', ctr)
	 * ```
	 * @since 6.0.0
	*/ emitSafe<E extends keyof Events> (event: E, ...args: Parameters<Events[E]>): Promise<boolean>

	/**
	 * Get the Registered Event Listeners
	 * @example
	 * ```
	 * const controller = new Server({ })
	 * 
	 * controller
	 *   .on('test')
	 *   .on('ok')
	 * 
	 * controller.eventNames() // [ 'test', 'ok' ]
	 * ```
	 * @since 6.0.0
	*/ eventNames(): (keyof Events | string | symbol)[]
	/**
	 * Get the Raw listeners for an Event
	 * @example
	 * ```
	 * const controller = new Server({ })
	 * 
	 * controller.rawListeners('httpRequest')
	 * ```
	 * @since 6.0.0
	*/ rawListeners<E extends keyof Events>(event: E): Events[E][]
	/**
	 * Get the listeners for an Event
	 * @example
	 * ```
	 * const controller = new Server({ })
	 * 
	 * controller.listeners()
	 * ```
	 * @since 6.0.0
	*/ listeners<E extends keyof Events>(event: E): Events[E][]
	/**
	 * Get the amount of registered listeners
	 * @example
	 * ```
	 * const controller = new Server({ })
	 * 
	 * controller.on('test')
	 * 
	 * controller.listenerCount() // 1
	 * ```
	 * @since 6.0.0
	*/ listenerCount<E extends keyof Events>(event: E): number

	/**
	 * Get the maximum amount of listeners
	 * @example
	 * ```
	 * const controller = new Server({ })
	 * 
	 * controller.getMaxListeners() // 0
	 * ```
	 * @since 6.0.0
	*/ getMaxListeners(): number
	/**
	 * Set the maximum amount of listeners
	 * @example
	 * ```
	 * const controller = new Server({ })
	 * 
	 * controller.getMaxListeners(10)
	 * controller.getMaxListeners() // 10
	 * ```
	 * @since 6.0.0
	*/ setMaxListeners(maxListeners: number): this
}