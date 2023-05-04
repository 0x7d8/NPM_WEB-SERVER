import { Content } from "../functions/parseContent"
import { RealAny } from "../types/internal"

type Listener = (value: Content) => RealAny

export type RefListener = { index: number }

export default class Reference<Value extends Content = any> {
	private state: Value
	private processDataFn: ((value: Value) => Content | Promise<Content>) = (v) => v
	private listeners: (Listener | null)[] = []

	/**
	 * Create a new reference to use with the server
	 * @example
	 * ```
	 * const controller = new Server({ })
	 * 
	 * const ref = new Reference('Hello')
	 * 
	 * controller.path('/', (path) => path
	 *   .ws('/echo', (ws) => ws
	 *     .onConnect((ctr) => {
	 *       ctr.printRef(ref) // Will not emit the current state, only when the ref changes
	 *     })
	 *     .onMessage((ctr) => {
	 *       ref.set(ctr.rawMessage, {
	 *         emit: true // When disabled will not emit the current state to subscribers
	 *       }) // Will automatically end up echoing it because of the subscription & that to all listeners
	 *     })
	 *   )
	 * )
	 * ```
	 * @since 7.2.0
	*/ constructor(
		/** The Initial Value of the Reference */ initialValue: Value
	) {
		this.state = initialValue
	}

	/**
	 * Process data before sending it to listeners
	 * @example
	 * ```
	 * const ref = new Reference('Hello')
	 * 
	 * ref.processData((data) => {
	 *   return data + ', yes'
	 * })
	 * 
	 * ref.set('Nice')
	 * 
	 * // Will emit 'Nice, yes' to listeners instead of 'Nice'
	 * ```
	*/ public processData(callback: (value: Value) => Content): this {
		this.processDataFn = callback

		return this
	}

	/**
	 * Set the State of a Reference
	 * @example
	 * ```
	 * const ref = new Reference('Hello')
	 * 
	 * ref.set('Moin')
	 * 
	 * ref.get() // 'Moin'
	 * ```
	 * @since 7.2.0
	*/ public set(value: Value, options: {
		/**
		 * Whether to emit the State change to listeners
		 * @default true
		 * @since 7.2.0
		*/ emit?: boolean
	} = {}): this {
		const emit = options?.emit ?? true

		this.state = value

		if (emit) {
			const data = this.processDataFn(value)

			for (const listener of this.listeners) {
				if (listener) listener(data)
			}
		}

		return this
	}

	/**
	 * Get the Current State of the Reference
	 * @since 7.2.0
	*/ public get(): Value {
		return this.state
	}

	/**
	 * Listen for Changes (when actually emitted)
	 * @since 7.2.0
	*/ protected onChange(listener: Listener): RefListener {
		return {
			index: this.listeners.push(listener) - 1
		}
	}

	/**
	 * Remove a Listener by index
	 * @since 7.2.0
	*/ protected removeOnChange(listener: RefListener): this {
		this.listeners.splice(listener.index, 1)

		return this
	}
}