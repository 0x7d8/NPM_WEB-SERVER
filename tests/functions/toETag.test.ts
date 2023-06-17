import toETag from "src/functions/toETag"

test('parses 200 "hello world" to expect "c8-7b2afdea5bdb5306252af3010b61659e46415559"', () => {
	expect(toETag(Buffer.from('hello world'), {}, {}, 200)).toBe('c8-7b2afdea5bdb5306252af3010b61659e46415559')
})

test('parses 201 "hello world" to not expect "c8-7b2afdea5bdb5306252af3010b61659e46415559"', () => {
	expect(toETag(Buffer.from('hello world'), {}, {}, 201)).not.toBe('c8-7b2afdea5bdb5306252af3010b61659e46415559')
})

test('parses 201 "hello world" with random header to not expect "c8-7b2afdea5bdb5306252af3010b61659e46415559"', () => {
	expect(toETag(Buffer.from('hello world'), { random: Math.random().toString() }, {}, 201)).not.toBe('c8-7b2afdea5bdb5306252af3010b61659e46415559')
})