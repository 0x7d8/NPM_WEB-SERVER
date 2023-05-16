import RouteHTTP from "../types/http"
import RouteWS from "../types/webSocket"
import { isRegExp } from "util/types"
import { TemplatedApp } from "@rjweb/uws"
import { RealAny } from "../types/internal"

type Route = RouteHTTP | RouteWS
type OnChangeFn = (type: 'add' | 'remove', route: string | RegExp) => RealAny

/**
 * A Collection specifically made for storing Routes and handling them
 * @since 7.8.1
*/ export default class RouteCollection {
	protected onChangeHandle: OnChangeFn = () => null
	protected app: TemplatedApp
	protected routes: {
		http: RouteHTTP[]
		ws: RouteWS[]
	}

	/**
	 * Create a new Route Collection
	 * @since 7.8.1
	*/ constructor(uWSApp: TemplatedApp) {
		this.app = uWSApp
		this.routes = {
			http: [],
			ws: []
		}
	}

	/**
	 * Add a Route to the routes array
	 * @since 7.8.?
	*/ public add<Type extends 'ws' | 'http'>(type: Type, data: Type extends 'http' ? RouteHTTP : RouteWS): this {
		this.routes[type].push(data as never)
		this.onChangeHandle('add', data.path)

		return this
	}

	/**
	 * Remove a Route from the routes array
	 * @since 7.8.1
	*/ public remove(by: string | RegExp, at: 'ws' | 'http'): this
	public remove(by: Route): this
	public remove(by: string | RegExp | Route, at: 'ws' | 'http' = 'http'): this {
		if (typeof by === 'string' || isRegExp(by)) {
			this.routes[at].splice(this.routes[at].findIndex((r) => r.path.toString() === by.toString()), 1)

			this.onChangeHandle('remove', by)
		} else {
			const index = this.routes[at].findIndex((r) => Object.is(r, by))
			this.routes[by.type === 'websocket' ? 'ws' : 'http'].splice(index, 1)

			this.onChangeHandle('remove', this.routes[by.type === 'websocket' ? 'ws' : 'http'][index].path)
		}

		return this
	}


	/**
	 * the handler to call on any change
	*/ public onChange(handle: OnChangeFn): this {
		this.onChangeHandle = handle

		return this
	}
}