import parseURL from "./parseURL"

/**
 * Parses a Path to be valid for OpenAPI 3
 * @since 7.0.0
*/ export default function parsePath(path: string | string[]): string {
	if (Array.isArray(path)) path = path.join('/')

	return parseURL(path).href
}