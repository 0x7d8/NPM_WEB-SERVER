export type URL = {
	href: string
	path: string
	query: string
	fragments: string
}

/**
 * Efficiently parse URL Strings into a Object, also makes the path OpenAPI compatible
 * @since 7.8.8
*/ export default function parseURL(path: string): URL {
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
				const slicedPath = path.slice(progress)
				let splitterPos = slicedPath.indexOf('/')
				if (splitterPos === -1) {
					const queryPos = slicedPath.indexOf('?'), fragmentPos = slicedPath.indexOf('#')
					if (queryPos >= 0 && queryPos < (fragmentPos === -1 ? Infinity : fragmentPos)) {
						splitterPos = queryPos
					} else if (fragmentPos >= 0) {
						splitterPos = fragmentPos
					} else splitterPos = path.length - progress
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

	returns.path = decodeURIComponent(returns.path)
	returns.href = decodeURI(returns.href)

	return returns
}