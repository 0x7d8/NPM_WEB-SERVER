import { RoutedValidation } from "../../types/internal"
import WebSocket from "../../types/webSocket"

export default class RouteWS<Custom extends Record<any, any> = {}, Body = unknown> {
	private data: WebSocket

	/** Generate WS Endpoint */
	constructor(
		/** The Path of the Routes */ path: string,
		/** The Validations to add */ validations: RoutedValidation[] = []
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
	 * Add an Event when someone wants to Connect to the Socket
	 * @example
	 * ```
	 * const controller = new Server({ })
	 * 
	 * controller.path('/', (path) => path
	 *   .ws('/ws', (ws) => ws
	 *     .onUpgrade((ctr, end) => {
	 *       if (!ctr.queries.has('confirm')) return end(ctr.status(Status.BAD_REQUEST).print('Forgor the Confirm query'))
	 *     })
	 *   )
	 * )
	 * ```
	 * @since 5.10.0
	*/ onUpgrade(
		/** The Async Code to run when the Socket gets an Upgrade HTTP Request */ code: WebSocket<Custom>['onUpgrade']
	) {
		this.data.onUpgrade = code

		return this
	}

	/**
	 * Add an Event when someone Establishes a connection to the Socket
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
	*/ onConnect(
		/** The Async Code to run when the Socket is Established */ code: WebSocket<Custom>['onConnect']
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
	*/ onMessage(
		/** The Async Code to run on a Message */ code: WebSocket<Custom, Body>['onMessage']
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
	*/ onClose(
		/** The Async Code to run when the Socket Closes */ code: WebSocket<Custom, Body>['onClose']
	) {
		this.data.onClose = code

		return this
	}


	/**
	 * Internal Method for Generating WebSocket Object
	 * @since 6.0.0
	*/ getData() {
		return {
			webSockets: [this.data]
		}
	}
}