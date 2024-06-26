import { RateLimitConfig } from "@/types/internal"
import { as, time, number } from "@rjweb/utils"

export default class RateLimit<Excluded extends (keyof RateLimit)[] = []> {
	protected data: RateLimitConfig = {
		sortTo: number.generateCrypto(1, 10000000),
		penalty: time(10).s(),
		timeWindow: time(10).s(),
		maxHits: Infinity
	}

	/**
	 * Set the Ratelimit Identifier
	 * 
	 * This is useful for when you want to make two code seperate rate limit rules act like one, just assign them the
	 * same Identifier and they are interlinked. be wary, this *might* cause issues if the rate limits arent the same
	 * rules.
	 * @default number.generateCrypto(1, 10000000)
	 * @warn ONLY USE IF YOU KNOW WHAT YOU ARE DOING
	 * @since 8.7.2
	*/ public identifier(identifier?: number): Omit<RateLimit<[...Excluded, 'identifier']>, Excluded[number] | 'identifier'> {
		this.data.sortTo = identifier ?? number.generateCrypto(1, 10000000)

		return as<any>(this)
	}

	/**
	 * Set the Penalty when hitting a rate limit in ms
	 * 
	 * When the User hits the endpoint(s) more than `<maxHits>` in `<timeWindow>ms`, the penalty will be applied to
	 * the user and the user wont be able to access the endpoint for `<penalty>ms`, after that the users limits are reset
	 * for the endpoint(s). If the User hits the endpoint(s) less than `<maxHits>` in `<timeWindow>ms`, the penalty wont be applied
	 * and if `<timeWindow>ms` has passed, the limits will reset without any penalty applying.
	 * 
	 * You can always prevent a request / message from counting towards the ratelimit by calling `<HTTPRequest | WSMessage>.skipRateLimit()`
	 * @default time(10).s()
	 * @since 8.6.0
	*/ public penalty(ms: number): Omit<RateLimit<[...Excluded, 'penalty']>, Excluded[number] | 'penalty'> {
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
	*/ public window(ms: number): Omit<RateLimit<[...Excluded, 'window']>, Excluded[number] | 'window'> {
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
	*/ public hits(amount: number): Omit<RateLimit<[...Excluded, 'hits']>, Excluded[number] | 'hits'> {
		this.data.maxHits = amount

		return as<any>(this)
	}
}