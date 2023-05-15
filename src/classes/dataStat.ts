import { Hours } from "../types/context"

export const getPreviousHours = (): Hours[] => {
	return Array.from({ length: 7 }, (_, i) => (new Date().getHours() - (4 - i) + 24) % 24) as any
}

/**
 * A Utility used for keeping track of information and parsing it automatically
 * @example
 * ```
 * const stat = new DataStat(...)
 * ```
 * @since 7.3.0
*/ export default class DataStat {
	private secondStat: number = 0
	public stats: Record<'total' | 'perSecond' | Hours, number> = {
		total: 0, perSecond: 0,
		0: 0, 1: 0, 2: 0, 3: 0,
		4: 0, 5: 0, 6: 0, 7: 0,
		8: 0, 9: 0, 10: 0, 11: 0,
		12: 0, 13: 0, 14: 0, 15: 0,
		16: 0, 17: 0, 18: 0, 19: 0,
		20: 0, 21: 0, 22: 0, 23: 0
	}

	/**
	 * Create a new Data Stat
	 * @since 7.3.0
	*/ constructor() {
		setInterval(() => {
			this.stats.perSecond = this.secondStat
			this.secondStat = 0
		}, 1000)

		// Stats Cleaner
		setInterval(() => {
			const previousHours = getPreviousHours()

			this.stats[previousHours[6]] = 0
		}, 300000)
	}

	/**
	 * Increase a Stat
	 * @since 7.3.0
	*/ public increase(amount = 1): this {
		this.secondStat += amount
		this.stats.total += amount
		this.stats[new Date().getHours() as any as 'total'] += amount

		return this
	}
}