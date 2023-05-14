/**
 * Parses a Path to be valid for OpenAPI 3
 * @since 7.0.0
*/ export default function parsePath(path: string | string[]): string {
	if (Array.isArray(path)) path = path.join('/')

	path = path.replace(/\/+$/, '')

  const parts = path.replace(/^\/+/, '').split('/')

  for (let partIndex = 0; partIndex < parts.length; partIndex++) {
    if (!parts[partIndex]) {
      parts.splice(partIndex, 1)
      partIndex--
    }
  }

  return ('/' + parts.join('/')).replace(/\/\?|\/#/, (m) => m[1])
}