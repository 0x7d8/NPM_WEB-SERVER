import { Server } from "rjweb-server"
import { Runtime } from "@rjweb/runtime-node"

const server = new Server(Runtime, {
	port: 8000
})

server.path('/', (p) => p
	.static('./static', {
		stripHtmlEnding: true
	})
)

server.http((ctr) => {
  console.log(`Request made to ${ctr.url.href}`)
})

server.start()
	.then((port) => {
		console.log(`server started on port ${port}`)
	})
	.catch(console.error)