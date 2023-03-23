export default interface TypedEventEmitter<Events extends Record<string, (...args: any[]) => void>> {
  addListener<E extends keyof Events>(event: E, listener: Events[E]): this
  on<E extends keyof Events>(event: E, listener: Events[E]): this
  once<E extends keyof Events>(event: E, listener: Events[E]): this
  prependListener<E extends keyof Events>(event: E, listener: Events[E]): this
  prependOnceListener<E extends keyof Events>(event: E, listener: Events[E]): this

  off<E extends keyof Events>(event: E, listener: Events[E]): this
  removeAllListeners<E extends keyof Events>(event?: E): this
  removeListener<E extends keyof Events>(event: E, listener: Events[E]): this

  emit<E extends keyof Events> (event: E, ...args: Parameters<Events[E]>): boolean
  eventNames(): (keyof Events | string | symbol)[]
  rawListeners<E extends keyof Events>(event: E): Events[E][]
  listeners<E extends keyof Events>(event: E): Events[E][]
  listenerCount<E extends keyof Events>(event: E): number

  getMaxListeners(): number
  setMaxListeners(maxListeners: number): this
}