const { Server } = require('rjweb-server')
const { Readable } = require('stream')
const path = require('path')

const chatHistory = []
const chat = new Readable({
  read() {}
}).on('data', (data) => chatHistory.push(data.toString()))

const server = new Server({
	bind: '0.0.0.0',
	cors: false,
	port: 5000
})

server.path('/', (p) => p
	.static(path.join(__dirname, 'static'), {
		hideHTML: true
	})
  .ws('/chat/ws', (ws) => ws
		.onConnect((ctr) => {
			chatHistory.forEach((message) => ctr.print(message))
			ctr.printStream(chat, { destroyAbort: false })
			chat.push(`${ctr.queries.get('username', 'unknown')} has joined!`)
		})
		.onMessage((ctr) => {
			chat.push(`${ctr.queries.get('username', 'unknown')} said: ${ctr.rawMessage}`)
		})
		.onClose((ctr) => {
			chat.push(`${ctr.queries.get('username', 'unknown')} has left!`)
		})
	)
)

server.start().then((res) => {
	console.log(`website started on port ${res.port}`)
})