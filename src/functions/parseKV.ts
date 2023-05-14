import ValueCollection from "../classes/valueCollection"

const trimString = (str: string): string => {
  let start = 0, end = str.length - 1

  while (start < end && str[start] === ' ') {
    start++
  }

  while (end > start && str[end] === ' ') {
    end--
  }

  return str.substring(start, end + 1)
}

/**
 * Efficiently parse Key-Value Strings into ValueCollections
 * @since 7.0.0
*/ export default function parseKV(keyValue: string, equal = '=', splitter = '&'): ValueCollection<string, string> {
	const values = new ValueCollection<string, string>()

	if (!keyValue) return values

	let progress = 0
	while (progress < keyValue.length) {
		let splitterPos = keyValue.indexOf(splitter, progress)
		if (splitterPos === -1) splitterPos = keyValue.length

		let equalPos = keyValue.slice(progress, splitterPos).indexOf(equal)
		if (equalPos === -1) equalPos = splitterPos

		values.set(trimString(keyValue.slice(progress, progress + equalPos)), decodeURIComponent(keyValue.slice(progress + equalPos + 1, splitterPos)))
		progress += splitterPos + 1
	}

	return values
}