import { EventHandlerMap } from "../types/event"
import { EventEmitter } from "events"
import { MiddlewareInitted } from "../types/internal"

export default class SafeServerEventEmitter<Context extends Record<any, any>, Middlewares extends MiddlewareInitted[]> {
	private instance: EventEmitter = new EventEmitter()

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
	*/ public addListener<E extends keyof EventHandlerMap<Context, Middlewares>>(event: E, listener: EventHandlerMap<Context, Middlewares>[E]): this {
		this.instance.addListener(event, listener)

		return this
	}

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
	*/ public on<E extends keyof EventHandlerMap<Context, Middlewares>>(event: E, listener: EventHandlerMap<Context, Middlewares>[E]): this {
		this.instance.on(event, listener)

		return this
	}

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
	*/ public once<E extends keyof EventHandlerMap<Context, Middlewares>>(event: E, listener: EventHandlerMap<Context, Middlewares>[E]): this {
		this.instance.once(event, listener)

		return this
	}

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
	*/ public prependListener<E extends keyof EventHandlerMap<Context, Middlewares>>(event: E, listener: EventHandlerMap<Context, Middlewares>[E]): this {
		this.instance.prependListener(event, listener)

		return this
	}

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
	*/ public prependOnceListener<E extends keyof EventHandlerMap<Context, Middlewares>>(event: E, listener: EventHandlerMap<Context, Middlewares>[E]): this {
		this.instance.prependOnceListener(event, listener)

		return this
	}


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
	*/ public off<E extends keyof EventHandlerMap<Context, Middlewares>>(event: E, listener: EventHandlerMap<Context, Middlewares>[E]): this {
		this.instance.off(event, listener)

		return this
	}

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
	*/ public removeAllListeners<E extends keyof EventHandlerMap<Context, Middlewares>>(event?: E): this {
		this.instance.removeAllListeners(event)

		return this
	}

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
	*/ public removeListener<E extends keyof EventHandlerMap<Context, Middlewares>>(event: E, listener: EventHandlerMap<Context, Middlewares>[E]): this {
		this.instance.removeListener(event, listener)

		return this
	}


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
	*/ public emit<E extends keyof EventHandlerMap<Context, Middlewares>> (event: E, ...args: Parameters<EventHandlerMap<Context, Middlewares>[E]>): boolean {
		return this.instance.emit(event, ...args)
	}

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
	*/ public emitSafe<E extends keyof EventHandlerMap<Context, Middlewares>> (event: E, ...args: Parameters<EventHandlerMap<Context, Middlewares>[E]>): Promise<boolean> {
		return new Promise<boolean>(async(resolve, reject) => {
			const callback: undefined | Function | Function[] = (this.instance as any)._events[event]

			if (!callback) return resolve(false)
			if (Array.isArray(callback)) {
				for (const cb of callback) {
					try {
						await Promise.resolve(cb(...args))
					} catch (err) {
						return reject(err)
					}
				}

				return resolve(true)
			} else {
				try {
          await Promise.resolve(callback(...args))
        } catch (err) {
          return reject(err)
        }

        return resolve(true)
			}
		})
	}


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
	*/ public eventNames(): (keyof EventHandlerMap<Context, Middlewares> | string | symbol)[] {
		return this.instance.eventNames()
	}

	/**
	 * Get the Raw listeners for an Event
	 * @example
	 * ```
	 * const controller = new Server({ })
	 * 
	 * controller.rawListeners('httpRequest')
	 * ```
	 * @since 6.0.0
	*/ public rawListeners<E extends keyof EventHandlerMap<Context, Middlewares>>(event: E): EventHandlerMap<Context, Middlewares>[E][] {
		return this.instance.rawListeners(event) as any
	}

	/**
	 * Get the listeners for an Event
	 * @example
	 * ```
	 * const controller = new Server({ })
	 * 
	 * controller.listeners()
	 * ```
	 * @since 6.0.0
	*/ public listeners<E extends keyof EventHandlerMap<Context, Middlewares>>(event: E): EventHandlerMap<Context, Middlewares>[E][] {
		return this.instance.listeners(event) as any
	}

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
	*/ public listenerCount<E extends keyof EventHandlerMap<Context, Middlewares>>(event: E): number {
		return this.instance.listenerCount(event)
	}


	/**
	 * Get the maximum amount of listeners
	 * @example
	 * ```
	 * const controller = new Server({ })
	 * 
	 * controller.getMaxListeners() // 0
	 * ```
	 * @since 6.0.0
	*/ public getMaxListeners(): number {
		return this.instance.getMaxListeners()
	}

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
	*/ public setMaxListeners(maxListeners: number): this {
		this.instance.setMaxListeners(maxListeners)

		return this
	}
}