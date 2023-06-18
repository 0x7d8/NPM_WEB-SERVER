import { Server } from "rjweb-server"

export const server = new Server({
  port: 8000
})

server.path('/', (path) => path
  .http('GET', '/', (http) => http
    .onRequest((ctr) => {
      ctr.print('<a href="/api/hello">hello api</a>')
    })
  )
  .path('/api', (path) => path
    .loadESM('./routes')
  )
)

let requests = 0
server.on('httpRequest', (ctr) => {
  console.log(`Request made to ${ctr.url.href}`)

  requests++
  ctr.setCustom('requests', requests)
})

server.start()
	.then((port) => {
		console.log(`server started on port ${port}`)
	})
	.catch(console.error)