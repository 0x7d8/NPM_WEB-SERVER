import { Routed } from "../../types/internal"
import WebSocket from "../../types/webSocket"

export default class RouteWS {
	protected data: WebSocket

	/** Generate Content Type Block */
	constructor(
		/** The Path of the Routes */ path: string,
		/** The Validations to add */ validations: Routed[] = []
	) {
		this.data = {
			type: 'websocket',

			path,
			pathArray: path.split('/'),
			data: {
				validations
			}
		}
	}

	/**
	 * Add an Event when someone Connects to the Socket
	 * @example
	 * ```
	 * const controller = new Server({ })
	 * 
	 * controller.path('/', (path) => path
	 *   .ws('/ws', (ws) => ws
	 *     .onConnect((ctr) => {
	 *       console.log('Connected to Client')
	 *     })
	 *   )
	 * )
	 * ```
	 * @since 5.4.0
	*/
	onConnect(
		/** The Async Code to run on a Request */ code: WebSocket['onConnect']
	) {
		this.data.onConnect = code

		return this
	}

	/**
	 * Add an Event when someone sends a Message to the Socket
	 * @example
	 * ```
	 * const controller = new Server({ })
	 * 
	 * controller.path('/', (path) => path
	 *   .ws('/ws', (ws) => ws
	 *     .onMessage((ctr) => {
	 *       ctr.print(ctr.message)
	 *     })
	 *   )
	 * )
	 * ```
	 * @since 5.4.0
	*/
	onMessage(
		/** The Async Code to run on a Request */ code: WebSocket['onMessage']
	) {
		this.data.onMessage = code

		return this
	}

	/**
	 * Add an Event when someone Disconnects from the Socket
	 * @example
	 * ```
	 * const controller = new Server({ })
	 * 
	 * controller.path('/', (path) => path
	 *   .ws('/ws', (ws) => ws
	 *     .onClose((ctr) => {
	 *       console.log('Closed Client Connection')
	 *     })
	 *   )
	 * )
	 * ```
	 * @since 5.4.0
	*/
	onClose(
		/** The Async Code to run on a Request */ code: WebSocket['onClose']
	) {
		this.data.onClose = code

		return this
	}


	/**
	 * Internal Method for Generating WebSocket Object
	 * @since 5.4.0
	*/
	protected getWebSocket() {
		return {
			webSockets: [this.data]
		}
	}
}