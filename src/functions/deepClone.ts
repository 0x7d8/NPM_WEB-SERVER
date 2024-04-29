/**
 * Deep clone an Object
 * @since 9.2.7
*/ export default function deepClone<T>(obj: T): T {
	return JSON.parse(JSON.stringify(obj))
}