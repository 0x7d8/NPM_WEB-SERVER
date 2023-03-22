const emojis = {
	berry: 1,
	apple: 2
}

/** @type {import('rjweb-server').RouteFile} */
module.exports = {
	method: 'GET',
	path: '/getemojiid/<text>',

	async code(ctr) {
		let emoji = ''
		if (ctr.params.get('text') in emojis) emoji = emojis[ctr.params.get('text')]
		else return ctr.print('couldnt find emoji')

		return ctr.print(emoji)
	}
}