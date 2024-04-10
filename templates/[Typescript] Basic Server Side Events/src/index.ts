import { Server } from "rjweb-server"
import { Runtime } from "@rjweb/runtime-node"

const server = new Server(Runtime, {
  port: 8000
})

server.path('/', (path) => path
  .http('GET', '/sse/time', (http) => http
    .onRequest((ctr) => {
      ctr.headers.set('content-type', 'text/event-stream')
      ctr.headers.set('cache-control', 'no-cache')
      ctr.headers.set('connection', 'keep-alive')
      ctr.headers.set('x-accel-buffering', 'no')

      ctr.printChunked((print) => new Promise<void>((end) => {
        print('retry: 10000\n\n')

        const interval = setInterval(() => {
          print(`data: ${new Date().toISOString()}\n\n`)
        }, 1000)

        ctr.$abort(() => {
          clearInterval(interval)
          end()
        })
      }))
    })
  )
)

server.http((ctr) => {
  console.log(`Request made to ${ctr.url.href}`)
})

server.start()
  .then((port) => {
    console.log(`Server started on port ${port}`)
  })
  .catch(console.error)