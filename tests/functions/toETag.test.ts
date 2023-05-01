import toETag from "src/functions/toETag"

test('parses 200 "hello world" to expect "c8-75c4c58fe583d272e79332ccb6f61b1a31aa3f3f"', () => {
	expect(toETag(Buffer.from('hello world'), {}, 200)).toBe('c8-75c4c58fe583d272e79332ccb6f61b1a31aa3f3f')
})

test('parses 201 "hello world" to not expect "c8-75c4c58fe583d272e79332ccb6f61b1a31aa3f3f"', () => {
	expect(toETag(Buffer.from('hello world'), {}, 201)).not.toBe('c8-75c4c58fe583d272e79332ccb6f61b1a31aa3f3f')
})

test('parses 201 "hello world" with random header to not expect "c8-75c4c58fe583d272e79332ccb6f61b1a31aa3f3f"', () => {
	expect(toETag(Buffer.from('hello world'), { random: Math.random().toString() }, 201)).not.toBe('c8-75c4c58fe583d272e79332ccb6f61b1a31aa3f3f')
})