import parseKV from "src/functions/parseKV"

test('parses "ok=564&test=wasd" to expect ok to be "564" & for test to exist', () => {
	expect(parseKV('ok=564&test=wasd').get('ok')).toBe('564')
	expect(parseKV('ok=564&test=wasd').has('test')).toBeTruthy()
})

test('parses "ok&test" to expect ok & test to exist', () => {
	expect(parseKV('ok&test').has('ok')).toBeTruthy()
	expect(parseKV('ok&test').has('test')).toBeTruthy()
})

test('parses "ok" to expect ok to exist', () => {
	expect(parseKV('ok').has('ok')).toBeTruthy()
})