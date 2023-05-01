import addPrefixes from "src/functions/addPrefixes"

test('parses [{ path: "/hello" }] with key "path" and prefix "/root" to expect [{ path: "/root/hello" }]', () => {
	expect(addPrefixes([
		{
			path: "/hello"
		}
	], 'path', null, 'root')).toEqual([
		{
			path: "/root/hello"
		}
	])
})

test('parses [{ path: "/hello", split: ["", "hello"] }] with key "path", splitKey "split" and prefix "/root" to expect [{ path: "/root/hello", split: ["", "root", "hello"] }]', () => {
	expect(addPrefixes([
		{
			path: "/hello",
			split: ["", "hello"]
		}
	], 'path', 'split', 'root')).toEqual([
		{
			path: "/root/hello",
			split: ["", "root", "hello"]
		}
	])
})