import TypedEventEmitter from "../types/typedEventEmitter"
import { EventHandlerMap } from "../types/event"
import { EventEmitter } from "events"

export default class SafeServerEventEmitter extends (EventEmitter as any as new() => TypedEventEmitter<EventHandlerMap>) {
	emitSafe<E extends keyof EventHandlerMap>(event: E, ...args: Parameters<EventHandlerMap[E]>): Promise<boolean> {
		return new Promise<boolean>(async(resolve, reject) => {
			const callback: undefined | Function | Function[] = (this as any)._events[event]

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
}