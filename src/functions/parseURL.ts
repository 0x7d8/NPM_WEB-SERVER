export type URL = {
	href: string
	path: string
	query: string
	fragments: string
}

/**
 * Find where the path part ends when the url can be used without normalization
 * (starts with a single slash, no fragment, percent encoding, empty segments or trailing slash,
 * optionally followed by a non-empty query), returns -1 otherwise
*/ function plainPathEnd(url: string): number {
	const length = url.length
	if (length === 0 || url.charCodeAt(0) !== 47) return -1
	if (length === 1) return 1

	let previousSlash = true
	for (let i = 1; i < length; i++) {
		const code = url.charCodeAt(i)

		if (code === 47) {
			if (previousSlash) return -1
			previousSlash = true
		} else if (code === 63) {
			if (previousSlash && i > 1) return -1
			if (i === length - 1) return -1

			for (let j = i + 1; j < length; j++) {
				const queryCode = url.charCodeAt(j)
				if (queryCode === 35 || queryCode === 37) return -1
			}

			return i
		} else {
			if (code === 35 || code === 37) return -1
			previousSlash = false
		}
	}

	return previousSlash ? -1 : length
}

/**
 * Efficiently parse URL Strings into a Object, also makes the path OpenAPI compatible
 * @since 7.8.8
*/ export default function parseURL(path: string): URL {
	const plainEnd = plainPathEnd(path)
	if (plainEnd === path.length) return {
		href: path,
		path,
		query: '',
		fragments: ''
	}

	if (plainEnd !== -1) return {
		href: path,
		path: path.slice(0, plainEnd),
		query: path.slice(plainEnd + 1),
		fragments: ''
	}

	path = '/'.concat(path)

	let queryFirst = false
	const returns: URL = {
		href: '',
		path: '',
		query: '',
		fragments: ''
	}

	let progress = 0, mode: 'path' | 'query' | 'fragments' = 'path'
	while (progress < path.length) {
		switch (mode) {
			case "path": {
				let splitterPos = path.length - progress
				for (let i = progress; i < path.length; i++) {
					const code = path.charCodeAt(i)

					if (code === 47 || code === 63 || code === 35) {
						splitterPos = i - progress
						break
					}
				}

				if (path[progress + splitterPos] === '?' || path[progress + splitterPos] === '#') {
					mode = path[progress + splitterPos] === '?' ? 'query' : 'fragments'
					if (mode === 'query') queryFirst = true
				}

				if (splitterPos > 0) returns.path += '/'
				returns.path += path.slice(progress, progress + splitterPos)
				progress += splitterPos + 1

				break
			}

			case "fragments":
			case "query": {
				const symbol = mode === 'fragments' ? '?' : '#'

				let splitterPos = path.slice(progress).indexOf(symbol)
				if (splitterPos === -1) splitterPos = path.length - progress

				returns[mode] = path.slice(progress, progress + splitterPos)
				if (splitterPos !== path.length - progress) mode = mode === 'fragments' ? 'query' : 'fragments'

				progress += splitterPos + 1

				break
			}
		}
	}

	if (!returns.path) returns.path = '/'
	if (returns.path.length > 1 && returns.path[returns.path.length - 1] === '/') returns.path = returns.path.slice(0, -1)

	returns.href = returns.path
	if (returns.query || returns.fragments) {
		if (queryFirst && returns.query) {
			returns.href = returns.href.concat('?', returns.query)
			if (returns.fragments) {
				returns.href = returns.href.concat('#', returns.fragments)
			}
		} else if (!queryFirst && returns.query) {
			if (returns.fragments) {
				returns.href = returns.href.concat('#', returns.fragments, '?', returns.query)
			} else {
				returns.href = returns.href.concat('?', returns.query)
			}
		} else if (returns.fragments) {
			returns.href = returns.href.concat('#', returns.fragments)
		}
	}

	try {
		returns.path = decodeURI(returns.path)
		returns.href = decodeURI(returns.href)
	} catch { }

	return returns
}