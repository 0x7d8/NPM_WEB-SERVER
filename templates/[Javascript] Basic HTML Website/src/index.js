import { Server } from "rjweb-server"

const server = new Server({
	port: 8000
})

server.path('/', (p) => p
	.static('./static', {
		hideHTML: true
	})
)

server.on('httpRequest', (ctr) => {
  console.log(`Request made to ${ctr.url.href}`)
})

server.start()
	.then((port) => {
		console.log(`server started on port ${port}`)
	})
	.catch(console.error)