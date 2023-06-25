import { Multiply } from "ts-arithmetic"

class Size<Amount extends number> {
	private amount: Amount

	/**
	 * Initialize a new Size Class
	 * @since 8.0.0
	*/ constructor(amount: Amount) {
		this.amount = amount
	}


	/**
	 * Use the provided amount as bytes
	 * @example
	 * ```
	 * size(10).b() // 10
	 * ```
	 * @since 8.0.0
	*/ public b(): Amount {
		return this.amount
	}

	/**
	 * Use the provided amount as kilobytes
	 * @example
	 * ```
	 * size(10).kb() // 10240
	 * ```
	 * @since 8.0.0
	*/ public kb(): Multiply<Amount, 1024> {
		return this.amount * 1024 as never
	}

	/**
	 * Use the provided amount as megabytes
	 * @example
	 * ```
	 * size(10).mb() // 10485760
	 * ```
	 * @since 8.0.0
	*/ public mb(): Multiply<Multiply<Amount, 1024>, 1024> {
		return this.amount * 1024 * 1024 as never
	}

	/**
	 * Use the provided amount as gigabytes
	 * @example
	 * ```
	 * size(10).gb() // 10737418240
	 * ```
	 * @since 8.0.0
	*/ public gb(): Multiply<Multiply<Multiply<Amount, 1024>, 1024>, 1024> {
		return this.amount * 1024 * 1024 * 1024 as never
	}
}

/**
 * Utility for defining bytes
 * @example
 * ```
 * size(10).gb() // 10737418240
 * ```
 * @since 8.0.0
*/ export default function size<Amount extends number>(amount: Amount): Size<Amount> {
	return new Size(amount)
}