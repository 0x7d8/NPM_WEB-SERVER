const { Server, Channel } = require('rjweb-server')
const { Runtime } = require('@rjweb/runtime-node')
const path = require('path')

const chatRef = new Channel()

const server = new Server(Runtime, {
	port: 8000
})

const chatValidator = new server.Validator()
	.httpRequest((ctr, end) => {
		if (ctr.queries.get('username', '').length < 5) {
			return end(ctr.status(ctr.$status.BAD_REQUEST).print('Username must be at least 5 characters long'))
		}
	})

server.path('/', (p) => p
	.static(path.join(__dirname, 'static'), {
		stripHtmlEnding: true
	})
  .ws('/chat/ws', (ws) => ws
		.validate(chatValidator.use({}))
		.onOpen((ctr) => {
			ctr.printChannel(chatRef)

			chatRef.send('text', `${ctr.queries.get('username', 'unknown')} has joined!`)
		})
		.onMessage((ctr) => {
			chatRef.send('text', `${ctr.queries.get('username', 'unknown')} said: ${ctr.rawMessage}`)
		})
		.onClose((ctr) => {
			chatRef.send('text', `${ctr.queries.get('username', 'unknown')} has left!`)
		})
	)
)

server.http((ctr) => {
  console.log(`Request made to ${ctr.url.href}`)
})

server.start()
	.then((port) => {
		console.log(`server started on port ${port}`)
	})
	.catch(console.error)