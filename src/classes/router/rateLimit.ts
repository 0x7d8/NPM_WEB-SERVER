import { as, time, randomNum } from "rjutils-collection"
import { ExcludeFrom } from "../../types/internal"

export default class RouteRateLimit<Excluded extends (keyof RouteRateLimit)[] = []> {
	protected data: {
		sortTo: number
		penalty: number
		timeWindow: number
		maxHits: number
	} = {
		sortTo: randomNum(1, 10000000),
		penalty: time(10).s(),
		timeWindow: time(10).s(),
		maxHits: Infinity
	}

	/**
	 * Set the Penalty when hitting a rate limit in ms
	 * 
	 * When the User hits the endpoint(s) more than `<maxHits>` in `<timeWindow>ms`, the penalty will be applied to
	 * the user and the user wont be able to access the endpoint for `<penalty>ms`, after that the users limits are reset
	 * for the endpoint(s). If the User hits the endpoint(s) less than `<maxHits>` in `<timeWindow>ms`, the penalty wont be applied
	 * and if `<timeWindow>ms` has passed, the limits will reset without any penalty applying.
	 * 
	 You can always prevent a request / message from counting towards the ratelimit by calling `<HTTPRequest | WSMessage>.skipRateLimit()`
	 * @default time(10).s()
	 * @since 8.6.0
	*/ public penalty(ms: number): ExcludeFrom<RouteRateLimit<[...Excluded, 'penalty']>, [...Excluded, 'penalty']> {
		this.data.penalty = ms

		return as<any>(this)
	}

	/**
	 * Set the Time Window when hitting an endpoint (/ endpoints) in ms
	 * 
	 * When the User hits the endpoint(s) more than `<maxHits>` in `<timeWindow>ms`, the penalty will be applied to
	 * the user and the user wont be able to access the endpoint for `<penalty>ms`, after that the users limits are reset
	 * for the endpoint(s). If the User hits the endpoint(s) less than `<maxHits>` in `<timeWindow>ms`, the penalty wont be applied
	 * and if `<timeWindow>ms` has passed, the limits will reset without any penalty applying.
	 * 
	 * You can always prevent a request / message from counting towards the ratelimit by calling `<HTTPRequest | WSMessage>.skipRateLimit()`
	 * @default time(10).s()
	 * @since 8.6.0
	*/ public window(ms: number): ExcludeFrom<RouteRateLimit<[...Excluded, 'window']>, [...Excluded, 'window']> {
		this.data.timeWindow = ms

		return as<any>(this)
	}

	/**
	 * Set the Max Hits in a Time Window
	 * 
	 * When the User hits the endpoint(s) more than `<maxHits>` in `<timeWindow>ms`, the penalty will be applied to
	 * the user and the user wont be able to access the endpoint for `<penalty>ms`, after that the users limits are reset
	 * for the endpoint(s). If the User hits the endpoint(s) less than `<maxHits>` in `<timeWindow>ms`, the penalty wont be applied
	 * and if `<timeWindow>ms` has passed, the limits will reset without any penalty applying. Max Hits being `Infinity` means that the
	 * ratelimit is disabled (if wanting to remove router limit).
	 * 
	 * You can always prevent a request / message from counting towards the ratelimit by calling `<HTTPRequest | WSMessage>.skipRateLimit()`
	 * @default Infinity
	 * @since 8.6.0
	*/ public hits(amount: number): ExcludeFrom<RouteRateLimit<[...Excluded, 'hits']>, [...Excluded, 'hits']> {
		this.data.maxHits = amount

		return as<any>(this)
	}
}