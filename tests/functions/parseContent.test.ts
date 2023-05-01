import parseContent from "src/functions/parseContent"

test('parses "hello" to expect "hello" as buffer with no headers', async() => {
	expect(await parseContent('hello')).toEqual({
		content: Buffer.from('hello'),
		headers: {}
	})
})

test('parses 128 to expect "128" as buffer with no headers', async() => {
	expect(await parseContent(128)).toEqual({
		content: Buffer.from('128'),
		headers: {}
	})
})

test('parses { prop: 123 } to expect "{"prop":123}" as buffer with content type "application/json" header', async() => {
	expect(await parseContent({ prop: 123 })).toEqual({
		content: Buffer.from('{"prop":123}'),
		headers: {
			'content-type': Buffer.from('application/json')
		}
	})
})

test('parses { prop: 123 } with prettify "true" to expect "{\\n  "prop": 123\\n}" as buffer with content type "application/json" header', async() => {
	expect(await parseContent({ prop: 123 }, true)).toEqual({
		content: Buffer.from('{\n  "prop": 123\n}'),
		headers: {
			'content-type': Buffer.from('application/json')
		}
	})
})