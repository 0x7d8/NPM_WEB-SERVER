import parseURL from "src/functions/parseURL"

test('parses "////path/to/resource///?hello=123" to expect query to be "hello=123"', () => {
	expect(parseURL('////path/to/resource///?hello=123').query).toBe('hello=123')
})

test('parses "////path/to/resource///#hello=123" to expect fragments to be "hello=123"', () => {
	expect(parseURL('////path/to/resource///#hello=123').fragments).toBe('hello=123')
})

test('parses "////path/to/resource///?hello=123#ok=69" to expect query to be "hello=123"', () => {
	expect(parseURL('////path/to/resource///?hello=123#ok=69').query).toBe('hello=123')
})

test('parses "////path/to/resource///?hello=123#ok=69" to expect fragments to be "ok=69"', () => {
	expect(parseURL('////path/to/resource///?hello=123#ok=69').fragments).toBe('ok=69')
})