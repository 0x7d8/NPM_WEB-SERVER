<h1 align="center">Welcome to rjweb-server v5 👋</h1>
<div align="center">
  <a href="https://www.npmjs.com/package/rjweb-server" target="_blank">
    <img alt="Version" src="https://img.shields.io/npm/v/rjweb-server.svg">
  </a>
  <a href="https://github.com/rotvproHD/NPM_WEB-SERVER#readme" target="_blank">
    <img alt="Documentation" src="https://img.shields.io/badge/documentation-yes-brightgreen.svg" />
  </a>
  <a href="https://github.com/rotvproHD/NPM_WEB-SERVER/graphs/commit-activity" target="_blank">
    <img alt="Maintenance" src="https://img.shields.io/badge/Maintained%3F-yes-green.svg" />
  </a>

  Easy and Robust Way to create a Web Server in Node.js with the help of native C++ from uWebsockets
</div>

# INFO: Since we are using native C++ the full bundle is ~90MB
It allows insane performance though ;)


<br>
<br>

### 🏠 [Homepage](https://github.com/rotvproHD/NPM_WEB-SERVER#readme)
### 🛠️ [Changelog](https://github.com/rotvproHD/NPM_WEB-SERVER/blob/main/CHANGELOG.md)
### 🌐 [Wiki](https://rjweb-server.rjansen.de)

## Install

```sh
# NPM
npm i rjweb-server

# Yarn
yarn add rjweb-server

# pNPM
pnpm add rjweb-server
```

## Update Infos

- 0.X | Deprecated
- 1.X | Deprecated
- 2.X | Deprecated
- 3.X | Deprecated
- 4.X | Deprecated
- 5.X | Patches & Features

## Typescript

Importing
```ts
// CJS
import * as webserver from "rjweb-server"

// ESM
import webserver from "rjweb-server"
```

Interface for ctr Object
```ts
import { Server, HTTPRequestContext } from "rjweb-server"

const server = new Server({ })

server.path('/', (path) => path
  .http('GET', '/hello', async(ctr: HTTPRequestContext) => {
    if (!ctr.queries.has("name")) return ctr.print('please supply the name query!!')

    return ctr.print(`Hello, ${ctr.queries.get("name")}! How are you doing?`)
  })
)

// ...
```

Custom Properties in Ctr Object
(This also works in JavaScript, just remove the interface logic)
```ts
import { Server, HTTPRequestContext, RouteFile, Status } from "rjweb-server"
interface Custom {
  count: number
}

type Ctr<Body = any> = HTTPRequestContext<Custom, Body>
type CtrFile<Body = any> = RouteFile<Custom, Body>

const server = new Server({
  bind: '0.0.0.0', // The IP thats bound to
  port: 5000, // The Port which the Server runs on
})

server.path('/', (path) => path
  .http('GET', '/hello', async(ctr: Ctr) => {
    if (!ctr.queries.has("name")) return ctr.print('please supply the name queries!!')

    return ctr.print(`Hello, ${ctr.queries.get("name")}! You are Visit nr.${ctr['@'].count}`)
  })
  .http('POST', '/hello', async(ctr: Ctr<{ name?: string }>) => {
    if (!('name' in ctr.body)) return ctr.print('please supply the name property!!')

    return ctr.print(`Hello, ${ctr.body.name}! You are Visit nr.${ctr['@'].count}`)
  })
)

let count = 0
server.event('httpRequest', async(ctr: Ctr) => {
  ctr.setCustom('count', ++count) 

  console.log(`request made to ${decodeURI(ctr.url.pathname)} by ${ctr.client.ip}`)
}).event('runtimeError', async(ctr: Ctr, error) => {
  console.log(`error on path ${decodeURI(ctr.url.pathname)}!!!`)
  console.error(error)

  ctr.status(Status.INTERNAL_SERVER_ERROR)
  ctr.print('server error')
})

server.start().then((s) => {
  console.log(`server started on port ${s.port}`)
})
```

Function File
```ts
import { HTTPRequestContext, RouteFile, Status } from "rjweb-server"

interface Custom {
  count: number
} // You should import / export this Interface Stuff (look examples section)

interface Body {
  username?: string
}

type Ctr<Body = any> = HTTPRequestContext<Custom, Body>
type CtrFile<Body = any> = RouteFile<Custom, Body>

export = {
  method: 'POST',
  path: '/v2/account',

  async code(ctr) {
    if (!('username' in ctr.body)) return ctr.print('no username in body!!')

    ctr.status(Status.NO_CONTENT).print(ctr.body.username)
  }
} satisfies CtrFile<Body>
```

Middleware Intellisense
```ts
// webserver.d.ts

import { MiddlewareToProps } from "rjweb-server"
import { Props as AdditionalProps1 } from "random-middleware"
import { Props as AdditionalProps2 } from "random-middlewareasd"

declare module "rjweb-server" {
  export interface HTTPRequestContext extends MiddlewareToProps<[ AdditionalProps1, AdditionalProps2 ]> {}
}
```

## Usage

Initialize Server
```js
const { Server, Status } = require('rjweb-server')

const server = new Server({
  bind: '0.0.0.0', // The IP thats bound to
  cors: false, // If Cors Headers will be added
  port: 5000, // The Port which the Server runs on
  proxy: true, // If enabled, alternate IPs will be shown
  body: {
    enabled: true, // Whether to enable recieving POST Bodies
    maxSize: 20, // The Max POST Body Size in MB
    message: 'Payload too large' // Message that gets sent if the Limit is exceeded
  }
})

// ctr.params.get... is :name:, example /hello/0x4096
server.path('/', (path) => path // The / is the Path Prefix for all children paths
  .http('POST', '/post', async(ctr) => {
    return ctr.print(`Hello, ${ctr.body}! How are you doing?`)
  })
  .http('GET', '/profile/<user>', async(ctr) => {
    return ctr.printFile(`../images/profile/${ctr.params.get('user')}.png`, { addTypes: true })
  })
  .http('GET', '/reloadserver', async(ctr) => {
    if (!ctr.queries.has('password')) return ctr.print('provide the password to do this!!')
    if (ctr.queries.get('password') !== 'imApassword123!') return ctr.print('the password is incorrect!!')

    setTimeout(() => ctr.controller.reload(), 1000)
    return ctr.print('server reloaded')
  })
  .http('GET', '/redirect/<website>', async(ctr) => {
    switch (ctr.params.get('website')) {
      case "google":
        return ctr.redirect('https://www.google.com')

      case "youtube":
        return ctr.redirect('https://www.youtube.com')

      default:
        return ctr.print('Im only smart enough to redirect to google and youtube :P')
    }
  })
  .ws('/echo', (ws) => ws
    .onUpgrade((ctr, end) => {
      if (!ctr.queries.has('confirm')) return end(ctr.status(Status.BAD_REQUEST).print('Please dont forget the confirm query!'))
    })
    .onMessage((ctr) => {
      ctr.print(ctr.message)
    })
  )
  .redirect('/googleplz', 'https://www.google.com')
  .path('/api', (path) => path
    .http('GET', '/', (ctr) => ctr.print('welcome to api!'))
    .path('/v1', (path) => path
      .http('GET', '/', (ctr) => ctr.print('welcome to v1 api!'))
    )
    .path('/v2', (path) => path
      .http('GET', '/', (ctr) => ctr.print('welcome to v2 api!'))
    )
  )
)

server.start().then((s) => {
  console.log(`server started on port ${s.port}`)
})
```

Print to multiple Websockets Periodically
```js
const { Server } = require('rjweb-server')
const { Readable } = require('stream')

// This Stream will count up every second
const dataStream = (() => {
	let i = 0

  return new Readable({
		objectMode: true,
		construct() {
			setInterval(() => {
        this.push(++i)
      }, 1000)
		},
  })
}) ()

const server = new Server({
  bind: '0.0.0.0', // The IP thats bound to
  cors: false, // If Cors Headers will be added
  port: 5000, // The Port which the Server runs on
  proxy: true // If enabled, alternate IPs will be shown
})

server.path('/', (path) => path
  .ws('/infos', (ws) => ws
    .onConnect((ctr) => {
      ctr.printStream(dataStream, {
        destroyAbort: false
      })
    })
  )
)
```

Print Promises
```js
const { Server } = require('rjweb-server')
const wait = require('timers/promises').setTimeout

const server = new Server({
  bind: '0.0.0.0', // The IP thats bound to
  cors: false, // If Cors Headers will be added
  port: 5000, // The Port which the Server runs on
  proxy: true // If enabled, alternate IPs will be shown
})

// this request will load for 5 seconds and send the returned value
const handleHello = async() => {
  await wait(5000)
  return 'You just waited 5 seconds !!'
}

server.path('/wait5sec', (path) => path
  // this request will load for 5 seconds
  .http('GET', '/func', (ctr) => {
    return ctr.print(handleHello)
  }) // this request will also load for 5 seconds
  .http('GET', '/promise', async(ctr) => {
    await wait(5000)
    return ctr.print('You just waited 5 seconds !!')
  })
)

server.start().then((s) => {
  console.log(`server started on port ${s.port}`)
})
```

Authenticate Requests
```js
const { Server, Status } = require('rjweb-server')

const server = new Server({
  bind: '0.0.0.0', // The IP thats bound to
  cors: false, // If Cors Headers will be added
  port: 5000, // The Port which the Server runs on
  proxy: true // If enabled, alternate IPs will be shown
})

server.path('/account', (path) => path
  .validate(async(ctr) => { // Will Validate every request starting with the route block prefix (/account)
    if (!ctr.queries.has('password')) return ctr.status(Status.UNPROCESSABLE_ENTITY).print('Passwort Query Missing')
    if (ctr.queries.get('password') !== '123456 or database request or sum') return ctr.status(Status.UNAUTHORIZED).print('Unauthorized')

    return ctr.status(Status.OK) // <- Everything is OK
  })
  .http('GET', '/', async(ctr) => {
    return ctr.print('Account Infos: idk')
  })
  .http('POST', '/edit', async(ctr) => {
    return ctr.print('Edited Account Infos!')
  })
)
```

Use Middleware
```js
const { Server } = require('rjweb-server')
const someMiddleware = require('some-middleware')
const someOtherMiddleware = require('some-other-middleware')

const server = new Server({
  bind: '0.0.0.0', // The IP thats bound to
  cors: false, // If Cors Headers will be added
  port: 5000, // The Port which the Server runs on
  proxy: true // If enabled, alternate IPs will be shown
})

server.middleware(someMiddleware.init())
server.middleware(someOtherMiddleware.init())
// For Intellisense of the Middlewares look at the Typescript Section at the top of this file

server.start().then((s) => {
  console.log(`server started on port ${s.port}`)
})
```

Serve Static Files
```js
const { Server } = require('rjweb-server')

const server = new Server({
  bind: '0.0.0.0', // The IP thats bound to
  cors: false, // If Cors Headers will be added
  port: 5000, // The Port which the Server runs on
  proxy: true // If enabled, alternate IPs will be shown
})

server.path('/', (path) => path
  .static('./html', {
    hideHTML: true // If enabled will remove the html ending from files when serving
  }) // The html folder is in the root directory, NOTE: Static files will be prioritized over the defined routes
)

server.start().then((s) => {
  console.log(`server started on port ${s.port}`)
})
```

Add Headers on EVERY Request
```js
const { Server } = require('rjweb-server')

const server = new Server({
  bind: '0.0.0.0', // The IP thats bound to
  cors: false, // If Cors Headers will be added
  port: 5000, // The Port which the Server runs on
  proxy: true // If enabled, alternate IPs will be shown
})

server.defaultHeaders()
  .add('im-a-header', 'im the value')

server.start().then((s) => {
  console.log(`server started on port ${s.port}`)
})
```

Override Content-Types
```js
const { Server } = require('rjweb-server')

const server = new Server({
  bind: '0.0.0.0', // The IP thats bound to
  cors: false, // If Cors Headers will be added
  port: 5000, // The Port which the Server runs on
  proxy: true // If enabled, alternate IPs will be shown
})

server.contentTypes()
  .add('.jsn', 'application/json')
  .add('.jn', 'application/json')

server.start().then((s) => {
  console.log(`server started on port ${s.port}`)
})
```

Enable Dashboard
```js
const { Server } = require('rjweb-server')

const server = new Server({
  bind: '0.0.0.0',
  cors: false,
  port: 5000,
  dashboard: {
    enabled: true,
    path: '/dashboard', // The Dashboad is now accessible at /dashboard
    password: '124' // The password to use, if not set will not ask to provide one
  }
})

server.start().then((s) => {
  console.log(`server started on port ${s.port}`)
})
```

Custom Not Found / Server Error Page
```js
const { Server, Status } = require('rjweb-server')

const server = new Server({
  bind: '0.0.0.0',
  cors: false,
  port: 5000,
  proxy: true
})

server.event('http404', async(ctr) => {
  ctr.status(Status.NOT_FOUND)
  return ctr.print(`page "${ctr.url.pathname}" not found`)
})

server.event('runtimeError', async(ctr, error) => {
  ctr.status(Status.INTERNAL_SERVER_ERROR)
  ctr.print(`ERROR!!! ${error.stack}`)
  return console.log(ctr.error)
})

server.start().then((s) => {
  console.log(`server started on port ${s.port}`)
})
```

Custom Function on every request
```js
const { Server } = require('rjweb-server')

const server = new Server({
  bind: '0.0.0.0',
  cors: false,
  port: 5000,
  proxy: true
})

server.event('httpRequest', async(ctr) => {
  return console.log(`request made to ${decodeURI(ctr.url.href)} by ${ctr.client.ip}`)
  // DO NOT write any data or end the request
}).event('wsRequest', async(ctr) => {
  return console.log(`websocket request made to ${decodeURI(ctr.url.href)} by ${ctr.client.ip}`)
  // DO NOT write any data or end the request
})

server.start().then((s) => {
  console.log(`server started on port ${s.port}`)
})
```

### Cleaning Up Functions
Load Functions from Directory
```js
const { Server } = require('rjweb-server')

const server = new Server({
  bind: '0.0.0.0',
  cors: false,
  port: 5000,
  proxy: true
})

server.path('/', (path) => path
  .loadCJS('./functions') // This loads CJS files (module.exports)
  .loadESM('./functions') // This loads ESM files (export default)
)

server.start().then((s) => {
  console.log(`server started on port ${s.port}`)
})
```

Making a function File
```js
/** @type {import('rjweb-server').RouteFile} */
module.exports = {
  method: 'GET',
  path: '/say/<word>',

  async code(ctr) {
    const word = ctr.params.get('word')

    return ctr.print(`I will say it!!!\n${word}`)
  }
}
```

### CLI
Serve a Static Folder using CLI
```sh
rjweb serve [path to folder] [arguments]

# Example
rjweb serve ./static --port=4444 --hideHTML
```

View Help
```sh
rjweb --help
```

## Official Middlewares
- rjweb-server-ejs (To Render EJS templates easily)
- rjweb-server-ratelimit (To add rate limiting easily)

## Full Example
- Javascript: https://replit.com/@RobertJansen/aous
- Typescript: https://replit.com/@RobertJansen/aous-ts

## Author

👤 **0x4096**

## 🤝 Contributing

Contributions, issues and feature requests are welcome!<br>
Feel free to check [issues page](https://github.com/rotvproHD/NPM_WEB-SERVER/issues). 

## Show your support

Give a Star if this project helped you!

## 📝 License

Copyright © [0x4096](https://github.com/rotvproHD).<br>
This project is MIT licensed.