import parsePath from "src/functions/parsePath"

test('parses "path/to/resource" to expect "/path/to/resource"', () => {
	expect(parsePath('path/to/resource')).toBe('/path/to/resource')
})

test('parses "////path/to/resource///" to expect "/path/to/resource"', () => {
	expect(parsePath('////path/to/resource///')).toBe('/path/to/resource')
})

test('parses "//path/to/resource///?q=123" to expect "/path/to/resource?q=123"', () => {
	expect(parsePath('//path/to/resource///?q=123')).toBe('/path/to/resource?q=123')
})

test('parses "//path/to/resource///#q=123" to expect "/path/to/resource#q=123"', () => {
	expect(parsePath('//path/to/resource///#q=123')).toBe('/path/to/resource#q=123')
})

test('parses "//path/to/resource///#q=123" to expect "/path/to/resource#q=123?ok=123"', () => {
	expect(parsePath('//path/to/resource///#q=123?ok=123')).toBe('/path/to/resource#q=123?ok=123')
})