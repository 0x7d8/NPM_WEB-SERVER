import { Server } from "rjweb-server"
import { Runtime } from "@rjweb/runtime-node"

const server = new Server(Runtime, {
  port: 8000
}, [], {
  requests: 0
})

export const fileRouter = new server.FileLoader('/api')
  .load('./routes', { fileBasedRouting: true })
  .export()

server.path('/', (path) => path
  .http('GET', '/', (http) => http
    .onRequest((ctr) => {
      ctr.print('<a href="/api/hello">hello api</a>')
    })
  )
)

let requests = 0
server.http((ctr) => {
  console.log(`Request made to ${ctr.url.href}`)

  ctr["@"].requests = ++requests
})

server.start()
  .then((port) => {
    console.log(`Server started on port ${port}`)
  })
  .catch(console.error)