import { Server } from "rjweb-server"
import { Runtime } from "@rjweb/runtime-node"

const server = new Server(Runtime, {
  port: 8000
}, [], {
  requests: 0
})

const authenticator = new server.Validator<{ users: Record<string, string> }>()
  .context<{ user: string }>()
  .httpRequest((ctr, end, config) => {
    const password = ctr.queries.get('password')

    if (!password) {
      return end(ctr.status(ctr.$status.BAD_REQUEST).print('No Password Provided'))
    }

    for (const [user, pass] of Object.entries(config.users)) {
      if (pass === password) {
        ctr["@"].user = user
        return
      }
    }

    end(ctr.status(ctr.$status.UNAUTHORIZED).print('Invalid Password Provided'))
  })

export const fileRouter = new server.FileLoader('/api')
  .validate(authenticator.use({ users: {
    ben: 'IAMben',
    alice: 'IAMalice1!',
    bob: 'IaMbob123'
  } }))
  .load('./routes', { fileBasedRouting: true })
  .export()

server.path('/', (path) => path
  .http('GET', '/', (http) => http
    .onRequest((ctr) => {
      ctr.print('<a href="/api/hello">hello api, password is IAMben for ben</a>')
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