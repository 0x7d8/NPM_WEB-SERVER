import parseStatus from "src/functions/parseStatus"

test('parses 200 to expect "200 OK"', () => {
	expect(parseStatus(200)).toBe('200 OK')
})

test('parses 200 with msg "Test" to expect "200 Test"', () => {
	expect(parseStatus(200, 'Test')).toBe('200 Test')
})

test('parses 876 to expect "876 Unknown"', () => {
	expect(parseStatus(876)).toBe('876 Unknown')
})

test('parses 876 with msg "Test" to expect "876 Test"', () => {
	expect(parseStatus(876, 'Test')).toBe('876 Test')
})