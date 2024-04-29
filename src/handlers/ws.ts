import Route from "@/classes/Route"
import { WsContext } from "@/types/implementation/contexts/ws"
import { WebsocketData } from "@/types/implementation/handle"
import { Server } from "@/index"
import { UsableMiddleware } from "@/classes/Middleware"

export default async function wsHandler({ context, custom, aborter }: WebsocketData, ws: WsContext, server: Server<any, any, any>, middlewares: UsableMiddleware[]) {
	const route = context.route as Route<'ws'>

	context.elapsed(true)
	context.body.raw = Buffer.from(ws.message() as ArrayBuffer)
	context.endFn = false

	switch (ws.type()) {
		case "open": {
			const ctr = new context.global.classContexts.WsOpen(context, ws, aborter.signal)
			ctr["@"] = custom

			for (let i = 0; i < middlewares.length; i++) {
				if (aborter.signal.aborted) return
				const middleware = middlewares[i]

				if (middleware.callbacks.wsOpen) {
					try {
						await Promise.resolve(middleware.callbacks.wsOpen(middleware.config, server, context, ctr, () => context.endFn = true))
					} catch (err) {
						const error = context.handleError(err, `ws.handle.middleware.${i}.wsOpen`)

						if (context.global.errorHandlers.wsOpen) {
							try {
								await Promise.resolve(context.global.errorHandlers.wsOpen(ctr, error))
							} catch (err) {
								context.global.logger.error(`An Error has occured on ${context.url.method} ${context.url.href}\n${error.toString()}`)
							}
						} else {
							context.global.logger.error(`An Error has occured on ${context.url.method} ${context.url.href}\n${error.toString()}`)
						}
					}

					if (context.endFn) break
				}
			}

			if (!context.endFn) for (let i = 0; i < route.validators.length; i++) {
				const validator = route.validators[i]

				const values = Array.from(validator.listeners.wsOpen.values())
				for (let j = 0; j < validator.listeners.wsOpen.size; j++) {
					if (aborter.signal.aborted) return
					const validate = values[j]

					try {
						await Promise.resolve(validate(ctr, () => context.endFn = true, validator.data))
					} catch (err) {
						const error = context.handleError(err, `ws.handle.validator.${i}.listeners.${j}.wsOpen`)

						if (context.global.errorHandlers.wsOpen) {
							try {
								await Promise.resolve(context.global.errorHandlers.wsOpen(ctr, error))
							} catch (err) {
								context.global.logger.error(`An Error has occured on ${context.url.method} ${context.url.href}\n${error.toString()}`)
							}
						} else {
							context.global.logger.error(`An Error has occured on ${context.url.method} ${context.url.href}\n${error.toString()}`)
						}
					}
				}
			}

			if (route.data.onOpen && !context.endFn && !aborter.signal.aborted) {
				try {
					await Promise.resolve(route.data.onOpen(ctr))
				} catch (err) {
					const error = context.handleError(err, 'ws.handle.onOpen')

					if (context.global.errorHandlers.wsOpen) {
						try {
							await Promise.resolve(context.global.errorHandlers.wsOpen(ctr, error))
						} catch (err) {
							context.global.logger.error(`An Error has occured on ${context.url.method} ${context.url.href}\n${error.toString()}`)
						}
					} else {
						context.global.logger.error(`An Error has occured on ${context.url.method} ${context.url.href}\n${error.toString()}`)
					}
				}
			}

			for (let i = 0; i < middlewares.length; i++) {
				if (aborter.signal.aborted) return
				const middleware = middlewares[i]

				if (middleware.callbacks.wsOpen) {
					try {
						await Promise.resolve(middleware.callbacks.wsOpen(middleware.config, server, context, ctr, () => context.endFn = true))
					} catch (err) {
						const error = context.handleError(err, `ws.handle.middleware.${i}.wsOpen`)

						if (context.global.errorHandlers.wsOpen) {
							try {
								await Promise.resolve(context.global.errorHandlers.wsOpen(ctr, error))
							} catch (err) {
								context.global.logger.error(`An Error has occured on ${context.url.method} ${context.url.href}\n${error.toString()}`)
							}
						} else {
							context.global.logger.error(`An Error has occured on ${context.url.method} ${context.url.href}\n${error.toString()}`)
						}
					}

					if (context.endFn) break
				}
			}

			for (let i = 0; i < middlewares.length; i++) {
				const middleware = middlewares[i]

				if (middleware.finishCallbacks.wsOpen) {
					try {
						await Promise.resolve(middleware.finishCallbacks.wsOpen(middleware.config, server, context, ctr, context.elapsed()))
					} catch (err) {
						const error = context.handleError(err, `ws.handle.middleware.${i}.wsOpenFinish`)

						if (context.global.errorHandlers.wsOpen) {
							try {
								await Promise.resolve(context.global.errorHandlers.wsOpen(ctr, error))
							} catch (err) {
								context.global.logger.error(`An Error has occured on ${context.url.method} ${context.url.href}\n${error.toString()}`)
							}
						} else {
							context.global.logger.error(`An Error has occured on ${context.url.method} ${context.url.href}\n${error.toString()}`)
						}
					}
				}
			}

			if (context.global.finishHandlers.wsOpen) try {
				await Promise.resolve(context.global.finishHandlers.wsOpen(ctr, context.elapsed()))
			} catch (err) {
				const error = context.handleError(err, 'ws.handle.onOpenFinish')

				if (context.global.errorHandlers.wsOpen) {
					try {
						await Promise.resolve(context.global.errorHandlers.wsOpen(ctr, error))
					} catch (err) {
						context.global.logger.error(`An Error has occured on ${context.url.method} ${context.url.href}\n${error.toString()}`)
					}
				} else {
					context.global.logger.error(`An Error has occured on ${context.url.method} ${context.url.href}\n${error.toString()}`)
				}
			}

			break
		}

		case "message": {
			const ctr = new context.global.classContexts.WsMessage(context, ws, aborter.signal)
			ctr["@"] = custom

			if (route.ratelimit && route.ratelimit.maxHits !== Infinity && route.ratelimit.timeWindow !== Infinity) {
				let data = context.global.rateLimits.get(`ws+${ctr.client.ip}-${route.ratelimit.sortTo}`, {
					hits: 0,
					end: Date.now() + route.ratelimit.timeWindow
				})
		
				if (data.hits + 1 > route.ratelimit.maxHits && data.end > Date.now()) {
					if (data.hits === route.ratelimit.maxHits) data.end += route.ratelimit.penalty
		
					context.endFn = true
					if (context.global.rateLimitHandlers.wsMessage) {
						try {
							await Promise.resolve(context.global.rateLimitHandlers.wsMessage(ctr))
						} catch (err) {
							const error = context.handleError(err, 'ws.handle.rateLimitHandlers.wsMessage')

							if (context.global.errorHandlers.wsMessage) {
								try {
									await Promise.resolve(context.global.errorHandlers.wsMessage(ctr, error))
								} catch (err) {
									context.global.logger.error(`An Error has occured on ${context.url.method} ${context.url.href}\n${error.toString()}`)
								}
							} else {
								context.global.logger.error(`An Error has occured on ${context.url.method} ${context.url.href}\n${error.toString()}`)
							}
						}
					}
				} else if (data.end < Date.now()) {
					context.global.rateLimits.delete(`ws+${ctr.client.ip}-${route.ratelimit.sortTo}`)
		
					data = {
						hits: 0,
						end: Date.now() + route.ratelimit.timeWindow
					}
				}
			}

			for (let i = 0; i < middlewares.length; i++) {
				if (aborter.signal.aborted) return
				const middleware = middlewares[i]
		
				if (middleware.callbacks.wsMessage) {
					try {
						await Promise.resolve(middleware.callbacks.wsMessage(middleware.config, server, context, ctr, () => context.endFn = true))
					} catch (err) {
						const error = context.handleError(err, `ws.handle.middleware.${i}.wsMessage`)

						if (context.global.errorHandlers.wsMessage) {
							try {
								await Promise.resolve(context.global.errorHandlers.wsMessage(ctr, error))
							} catch (err) {
								context.global.logger.error(`An Error has occured on ${context.url.method} ${context.url.href}\n${error.toString()}`)
							}
						} else {
							context.global.logger.error(`An Error has occured on ${context.url.method} ${context.url.href}\n${error.toString()}`)
						}
					}

					if (context.endFn) break
				}
			}

			if (!context.endFn) for (let i = 0; i < route.validators.length; i++) {
				const validator = route.validators[i]

				const values = Array.from(validator.listeners.wsMessage.values())
				for (let j = 0; j < validator.listeners.wsMessage.size; j++) {
					if (aborter.signal.aborted) return
					const validate = values[j]

					try {
						await Promise.resolve(validate(ctr, () => context.endFn = true, validator.data))
					} catch (err) {
						const error = context.handleError(err, `ws.handle.validator.${i}.listeners.${j}.wsMessage`)

						if (context.global.errorHandlers.wsMessage) {
							try {
								await Promise.resolve(context.global.errorHandlers.wsMessage(ctr, error))
							} catch (err) {
								context.global.logger.error(`An Error has occured on ${context.url.method} ${context.url.href}\n${error.toString()}`)
							}
						} else {
							context.global.logger.error(`An Error has occured on ${context.url.method} ${context.url.href}\n${error.toString()}`)
						}
					}
				}
			}

			if (route.data.onMessage && !context.endFn && !aborter.signal.aborted) {
				try {
					await Promise.resolve(route.data.onMessage(ctr))
				} catch (err) {
					const error = context.handleError(err, 'ws.handle.onMessage')

					if (context.global.errorHandlers.wsMessage) {
						try {
							await Promise.resolve(context.global.errorHandlers.wsMessage(ctr, error))
						} catch (err) {
							context.global.logger.error(`An Error has occured on ${context.url.method} ${context.url.href}\n${error.toString()}`)
						}
					} else {
						context.global.logger.error(`An Error has occured on ${context.url.method} ${context.url.href}\n${error.toString()}`)
					}
				}
			}

			for (let i = 0; i < middlewares.length; i++) {
				const middleware = middlewares[i]

				if (middleware.finishCallbacks.wsMessage) {
					try {
						await Promise.resolve(middleware.finishCallbacks.wsMessage(middleware.config, server, context, ctr, context.elapsed()))
					} catch (err) {
						const error = context.handleError(err, `ws.handle.middleware.${i}.wsmessageFinish`)

						if (context.global.errorHandlers.wsMessage) {
							try {
								await Promise.resolve(context.global.errorHandlers.wsMessage(ctr, error))
							} catch (err) {
								context.global.logger.error(`An Error has occured on ${context.url.method} ${context.url.href}\n${error.toString()}`)
							}
						} else {
							context.global.logger.error(`An Error has occured on ${context.url.method} ${context.url.href}\n${error.toString()}`)
						}
					}
				}
			}

			if (context.global.finishHandlers.wsMessage) try {
				await Promise.resolve(context.global.finishHandlers.wsMessage(ctr, context.elapsed()))
			} catch (err) {
				const error = context.handleError(err, 'ws.handle.onMessageFinish')

				if (context.global.errorHandlers.wsMessage) {
					try {
						await Promise.resolve(context.global.errorHandlers.wsMessage(ctr, error))
					} catch (err) {
						context.global.logger.error(`An Error has occured on ${context.url.method} ${context.url.href}\n${error.toString()}`)
					}
				} else {
					context.global.logger.error(`An Error has occured on ${context.url.method} ${context.url.href}\n${error.toString()}`)
				}
			}

			break
		}

		case "close": {
			const ctr = new context.global.classContexts.WsClose(context)
			ctr["@"] = custom

			for (let i = 0; i < middlewares.length; i++) {
				if (aborter.signal.aborted) return
				const middleware = middlewares[i]

				if (middleware.callbacks.wsClose) {
					try {
						await Promise.resolve(middleware.callbacks.wsClose(middleware.config, server, context, ctr, () => context.endFn = true))
					} catch (err) {
						const error = context.handleError(err, `ws.handle.middleware.${i}.wsClose`)

						if (context.global.errorHandlers.wsClose) {
							try {
								await Promise.resolve(context.global.errorHandlers.wsClose(ctr, error))
							} catch (err) {
								context.global.logger.error(`An Error has occured on ${context.url.method} ${context.url.href}\n${error.toString()}`)
							}
						} else {
							context.global.logger.error(`An Error has occured on ${context.url.method} ${context.url.href}\n${error.toString()}`)
						}
					}

					if (context.endFn) break
				}
			}

			if (!context.endFn) for (let i = 0; i < route.validators.length; i++) {
				const validator = route.validators[i]

				const values = Array.from(validator.listeners.wsClose.values())
				for (let j = 0; j < validator.listeners.wsClose.size; j++) {
					if (aborter.signal.aborted) return
					const validate = values[j]

					try {
						await Promise.resolve(validate(ctr, () => context.endFn = true, validator.data))
					} catch (err) {
						const error = context.handleError(err, `ws.handle.validator.${i}.listeners.${j}.wsClose`)

						if (context.global.errorHandlers.wsClose) {
							try {
								await Promise.resolve(context.global.errorHandlers.wsClose(ctr, error))
							} catch (err) {
								context.global.logger.error(`An Error has occured on ${context.url.method} ${context.url.href}\n${error.toString()}`)
							}
						} else {
							context.global.logger.error(`An Error has occured on ${context.url.method} ${context.url.href}\n${error.toString()}`)
						}
					}
				}
			}

			aborter.abort()

			if (route.data.onClose && !context.endFn) {
				try {
					await Promise.resolve(route.data.onClose(ctr))
				} catch (err) {
					const error = context.handleError(err, 'ws.handle.onClose')

					if (context.global.errorHandlers.wsClose) {
						try {
							await Promise.resolve(context.global.errorHandlers.wsClose(ctr, error))
						} catch (err) {
							context.global.logger.error(`An Error has occured on ${context.url.method} ${context.url.href}\n${error.toString()}`)
						}
					} else {
						context.global.logger.error(`An Error has occured on ${context.url.method} ${context.url.href}\n${error.toString()}`)
					}
				}
			}

			for (let i = 0; i < middlewares.length; i++) {
				const middleware = middlewares[i]

				if (middleware.finishCallbacks.wsClose) {
					try {
						await Promise.resolve(middleware.finishCallbacks.wsClose(middleware.config, server, context, ctr, context.elapsed()))
					} catch (err) {
						const error = context.handleError(err, `ws.handle.middleware.${i}.wsCloseFinish`)

						if (context.global.errorHandlers.wsClose) {
							try {
								await Promise.resolve(context.global.errorHandlers.wsClose(ctr, error))
							} catch (err) {
								context.global.logger.error(`An Error has occured on ${context.url.method} ${context.url.href}\n${error.toString()}`)
							}
						} else {
							context.global.logger.error(`An Error has occured on ${context.url.method} ${context.url.href}\n${error.toString()}`)
						}
					}
				}
			}

			if (context.global.finishHandlers.wsClose) try {
				await Promise.resolve(context.global.finishHandlers.wsClose(ctr, context.elapsed()))
			} catch (err) {
				const error = context.handleError(err, 'ws.handle.onCloseFinish')

				if (context.global.errorHandlers.wsClose) {
					try {
						await Promise.resolve(context.global.errorHandlers.wsClose(ctr, error))
					} catch (err) {
						context.global.logger.error(`An Error has occured on ${context.url.method} ${context.url.href}\n${error.toString()}`)
					}
				} else {
					context.global.logger.error(`An Error has occured on ${context.url.method} ${context.url.href}\n${error.toString()}`)
				}
			}

			break
		}
	}
}