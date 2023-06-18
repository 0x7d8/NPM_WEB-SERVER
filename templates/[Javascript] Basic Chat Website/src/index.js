const { Server, Reference } = require('rjweb-server')
const path = require('path')

const chatRef = new Reference('')

const server = new Server({
	port: 8000
})

server.path('/', (p) => p
	.static(path.join(__dirname, 'static'), {
		hideHTML: true
	})
  .ws('/chat/ws', (ws) => ws
		.onConnect((ctr) => {
			ctr.printRef(chatRef)

			chatRef.set(`${ctr.queries.get('username', 'unknown')} has joined!`)
		})
		.onMessage((ctr) => {
			chatRef.set(`${ctr.queries.get('username', 'unknown')} said: ${ctr.rawMessage}`)
		})
		.onClose((ctr) => {
			chatRef.set(`${ctr.queries.get('username', 'unknown')} has left!`)
		})
	)
)

server.on('httpRequest', (ctr) => {
  console.log(`Request made to ${ctr.url.href}`)
})

server.start()
	.then((port) => {
		console.log(`server started on port ${port}`)
	})
	.catch(console.error)