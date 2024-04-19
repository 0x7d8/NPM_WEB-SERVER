# `rjweb-server`

<img style="float: right;" alt="RJWEB Icon" height="104" src="https://cdn.rjns.dev/rjweb/icon.svg">

Easy and Lightweight Web Server Library

🏠 [Homepage](https://github.com/0x7d8/NPM_WEB-SERVER#readme)
🔍 [Documentation](https://server.rjweb.dev)

![lines of code](https://tokei.rs/b1/github/0x7d8/NPM_WEB-SERVER?category=code)
![files](https://tokei.rs/b1/github/0x7d8/NPM_WEB-SERVER?category=files)

## Disclaimer

This Package is intended to be used in the backend.

- ✔️ ESM
- ✔️ CJS
- ✔️ Typescript

## Install

```sh
npm install rjweb-server
yarn add rjweb-server
pnpm add rjweb-server
bun install rjweb-server
```

You will need a runtime to actually use the server. (adapt command to your package manager)

```sh
npm install @rjweb/runtime-bun # for bun users
npm install @rjweb/runtime-node # for nodejs users (who couldve guessed, may also work with deno though)
```

## Migrating

[From 8.X to 9.X](https://github.com/0x7d8/NPM_WEB-SERVER/blob/main/migrating/9.md)

## Example Usage

All Utilities and examples for specific classes are available in the [Documentation](https://server.rjweb.dev).

This Web Server Library is not for pure beginners. For anything slightly advanced you will need basic knowledge
of servers. Same with the documentation, very few is provided directly. You should be able to find everything in
TSDoc `@example` sections of the respective Method.

### Basic Server

```ts
import { Server } from "rjweb-server"
import { Runtime } from "@rjweb/runtime-node"

const server = new Server(Runtime, {
  port: 8080 // https://server.rjweb.dev/types/ServerOptions
})

server.path('/', (path) => path
  .http('GET', '/', (http) => http
    .onRequest((ctr) => {
      return ctr.print('Hello World!')
    })
  )
)

server.start().then((port) => {
  console.log(`Server started on port ${port}!`)
})
```

### Serve Side Events

```ts
import { Server } from "rjweb-server"
import { Runtime } from "@rjweb/runtime-node"
import { time } from "@rjweb/utils"

const server = new Server(Runtime, {
  port: 8080 // https://server.rjweb.dev/types/ServerOptions
})

server.path('/', (path) => path
  .http('GET', '/timer', (http) => http
    .document({
      parameters: [
        {
          in: 'query',
          name: 'seconds',
          required: false,
          schema: {
            type: 'number'
          }
        }
      ]
    })
    .onRequest((ctr) => {
      ctr.headers.set('content-type', 'text/event-stream')
      ctr.headers.set('x-accel-buffering', 'no')
      ctr.headers.set('cache-control', 'no-cache')
      ctr.headers.set('connection', 'keep-alive')

      let seconds: number | null = null
      const secondsInt = parseInt(ctr.queries.get('seconds', ''))

      if (!isNaN(secondsInt) && secondsInt >= 1) seconds = secondsInt

      ctr.printChunked((print) => new Promise<void>(async(end) => {
        print('retry: 10000\n\n')

        let count = 0
        const interval = setInterval(() => {
          count++

          print(`data: ${count}\n\n`)
          if (seconds && seconds <= count) {
            clearInterval(interval)
            end()
          }
        }, time(1).s())

        ctr.$abort(() => {
          clearInterval(interval)
          end()
        })
      }))
    })
  )
  .http('GET', '/openapi', (http) => http
    .onRequest((ctr) => {
      return ctr.print(server.openAPI('Example Server', '1.0.0', { url: 'http://localhost.8080' }))
    })
  )
)

server.start().then((port) => {
  console.log(`Server started on port ${port}!`)
})
```

### Websockets

```ts
import { Server } from "rjweb-server"
import { Runtime } from "@rjweb/runtime-node"
import { time } from "@rjweb/utils"

const server = new Server(Runtime, {
  port: 8080 // https://server.rjweb.dev/types/ServerOptions
})

server.path('/', (path) => path
  .ws('/echo', (ws) => ws
    .onMessage(async(ctr) => {
      await ctr.print(ctr.messageType(), ctr.rawMessageBytes())
    })
  )
)

server.start().then((port) => {
  console.log(`Server started on port ${port}!`)
})
```

## Author

👤 **0x7d8**
🌐 [Website](https://rjansen.dev)
⭐ [GitHub](https://github.com/0x7d8)

## 🤝 Contributing

Contributions, issues and feature requests are welcome!
Feel free to check [issues page](https://github.com/0x7d8/NPM_WEB-SERVER/issues).

## Show your support

Give a ⭐️ if this project helps you!

## 📝 License

Copyright © 2024 [0x7d8](https://github.com/0x7d8).
This project is MIT licensed.
