<div align="center">

  [<img src="https://img.rjansen.de/rjweb/logo.png" style="padding-bottom:10px;" height="150">](https://www.npmjs.com/package/rjweb-server)

  [<img src="https://img.rjansen.de/rjweb/docs.svg" height="75px" style="margin-top:0px;">](https://docs.rjweb.rjansen.de)
  [<img src="https://img.rjansen.de/rjweb/types.svg" height="75px" style="margin-top:0px;margin-left:-15px;">](https://types.rjweb.rjansen.de)

  [<img src="https://img.rjansen.de/rjweb/changelog.svg" height="75px" style="margin-top:-25px;">](https://github.com/rotvproHD/NPM_WEB-SERVER/blob/main/CHANGELOG.md)

  [![install size](https://packagephobia.com/badge?p=rjweb-server)](https://packagephobia.com/result?p=rjweb-server)
  [![Socket Badge](https://socket.dev/api/badge/npm/package/rjweb-server)](https://socket.dev/npm/package/rjweb-server)

</div>

<br>

### 🍔 [v7 to v8 Migration Guide](https://docs.rjweb.rjansen.de/rjweb-server/v8/migrating-from-v7)
### 🍔 [v6 to v7 Migration Guide](https://docs.rjweb.rjansen.de/rjweb-server/v7/migrating-from-v6)
### 🍔 [v5 to v6 Migration Guide](https://docs.rjweb.rjansen.de/rjweb-server/v6/migrating-from-v5)

<br>
<br>

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
- 5.X | Deprecated
- 6.X | Deprecated
- 7.X | Patches
- 8.X | Patches & Features

## Typescript

Custom Properties in HTTP Object
(This also works in JavaScript, just remove the interface logic)
```ts
import { Server, HTTPRequestContext, Status } from "rjweb-server"
interface Custom {
  count: number
}

const server = new Server({
  bind: '0.0.0.0', // The IP thats bound to
  port: 5000, // The Port which the Server runs on
})

server.path('/', (path) => path
  .http<Custom>('GET', '/hello', (http) => http
    .onRequest(async(ctr) => {
      if (!ctr.queries.has("name")) return ctr.print('please supply the name queries!!')

      return ctr.print(`Hello, ${ctr.queries.get("name")}! You are Visit nr.${ctr['@'].count}`)
    })
  )
  .http<Custom, { name: string }>('POST', '/hello', (http) => http
    .onRequest(async(ctr) => {
      if (!('name' in ctr.body)) return ctr.print('please supply the name property!!')

      return ctr.print(`Hello, ${ctr.body.name}! You are Visit nr.${ctr['@'].count}`)
    })
  )
)

let count = 0
server.on('httpRequest', async(ctr: Ctr) => {
  ctr.setCustom('count', ++count) 

  console.log(`request made to ${decodeURI(ctr.url.pathname)} by ${ctr.client.ip}`)
}).on('httpError', async(ctr: Ctr, error) => {
  console.log(`error on path ${decodeURI(ctr.url.pathname)}!!!`)
  console.error(error)

  ctr.status(Status.INTERNAL_SERVER_ERROR)
  ctr.print('server error')
})

server.start()
  .then((port) => {
    console.log(`server started on port ${port}`)
  })
  .catch((e) => {
    console.error('An Error occured while starting the Server!\n', e)
  })
```

## Usage

Initialize Server
```js
const { Server, Status, size } = require('rjweb-server')

const server = new Server({
  bind: '0.0.0.0', // The IP thats bound to
  cors: false, // If Cors Headers will be added
  port: 5000, // The Port which the Server runs on
  proxy: true, // If enabled, alternate IPs will be shown
  body: {
    enabled: true, // Whether to enable recieving POST Bodies
    maxSize: size(10).mb(), // Use Size helper to easily get byte count
    message: 'Payload too large' // Message that gets sent if the Limit is exceeded
  }, httpCompression: {
    enabled: true, // whether compressing of http bodies is enabled
    disabledAlgorithms: ['br', 'deflate'] // algorithms to ignore for compression, in this case will only allow gzip
  }
})

// ctr.params.get... is :name:, example /hello/0x4096
server.path('/', (path) => path // The / is the Path Prefix for all children paths
  .http('POST', '/post', (http) => http
    .onRequest(async(ctr) => {
      return ctr.print(`Hello, ${ctr.body}! How are you doing?`)
    })
  )
  .http('GET', '/profile/<user>', (http) => http
    .onRequest(async(ctr) => {
      return ctr.printFile(`../images/profile/${ctr.params.get('user')}.png`, { addTypes: true })
    })
  )
  .http('GET', '/reloadserver', (http) => http
    .onRequest(async(ctr) => {
      if (!ctr.queries.has('password')) return ctr.print('provide the password to do this!!')
      if (ctr.queries.get('password') !== 'imApassword123!') return ctr.print('the password is incorrect!!')

      setTimeout(() => ctr.controller.reload(), 1000)
      return ctr.print('server reloaded')
    })
  )
  .http('GET', '/redirect/<website>', (http) => http
    .onRequest(async(ctr) => {
      switch (ctr.params.get('website')) {
        case "google":
          return ctr.redirect('https://www.google.com')

        case "youtube":
          return ctr.redirect('https://www.youtube.com')

        default:
          return ctr.print('Im only smart enough to redirect to google and youtube :P')
      }
    })
  )
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
    .http('GET', '/', (http) => http
      .onRequest((ctr) => ctr.print('welcome to api!'))
    )
    .path('/v1', (path) => path
      .http('GET', '/', (http) => http
        .onRequest((ctr) => ctr.print('welcome to v1 api!'))
      )
    )
    .path('/v2', (path) => path
      .http('GET', '/', (http) => http
        .onRequest((ctr) => ctr.print('welcome to v2 api!'))
      )
    )
  )
)

server.start()
  .then((port) => {
    console.log(`server started on port ${port}`)
  })
  .catch((e) => {
    console.error('An Error occured while starting the Server!\n', e)
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
  .http('GET', '/func', (http) => http
    .onRequest((ctr) => {
      return ctr.print(handleHello)
    })
  ) // this request will also load for 5 seconds
  .http('GET', '/promise', (http) => http
    .onRequest(async(ctr) => {
      await wait(5000)
      return ctr.print('You just waited 5 seconds !!')
    })
  )
)

server.start()
  .then((port) => {
    console.log(`server started on port ${port}`)
  })
  .catch((e) => {
    console.error('An Error occured while starting the Server!\n', e)
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
  .validate(async(ctr, end) => { // Will Validate every request starting with the route block prefix (/account)
    if (!ctr.queries.has('password')) return end(ctr.status(Status.UNPROCESSABLE_ENTITY).print('Passwort Query Missing'))
    if (ctr.queries.get('password') !== '123456 or database request or sum') return end(ctr.status(Status.UNAUTHORIZED).print('Unauthorized'))

    // else everything is OK, the request will only end if the end() function is called
  })
  .http('GET', '/', (http) => http
    .onRequest(async(ctr) => {
      return ctr.print('Account Infos: idk')
    })
  )
  .http('POST', '/edit', (http) => http
    .onRequest(async(ctr) => {
      return ctr.print(`Edited Account Infos to ${ctr.rawBody}!`)
    })
  )
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
}, [
  someMiddleware.config({}),
  someOtherMiddleware.config({})
])

server.start()
  .then((port) => {
    console.log(`server started on port ${port}`)
  })
  .catch((e) => {
    console.error('An Error occured while starting the Server!\n', e)
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

server.start()
  .then((port) => {
    console.log(`server started on port ${port}`)
  })
  .catch((e) => {
    console.error('An Error occured while starting the Server!\n', e)
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

server.defaultHeaders((dH) => dH
  .add('im-a-header', 'im the value')
)

server.start()
  .then((port) => {
    console.log(`server started on port ${port}`)
  })
  .catch((e) => {
    console.error('An Error occured while starting the Server!\n', e)
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

server.contentTypes((ct) => cT
  .add('.jsn', 'application/json')
  .add('.jn', 'application/json')
)

server.start()
  .then((port) => {
    console.log(`server started on port ${port}`)
  })
  .catch((e) => {
    console.error('An Error occured while starting the Server!\n', e)
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

server.start()
  .then((port) => {
    console.log(`server started on port ${port}`)
  })
  .catch((e) => {
    console.error('An Error occured while starting the Server!\n', e)
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

server.on('route404', async(ctr) => {
  ctr.status(Status.NOT_FOUND)
  return ctr.print(`page "${ctr.url.pathname}" not found`)
})

server.on('httpError', async(ctr, error) => {
  ctr.status(Status.INTERNAL_SERVER_ERROR)
  ctr.print(`ERROR!!! ${error.stack}`)
  return console.log(ctr.error)
})

server.start()
  .then((port) => {
    console.log(`server started on port ${port}`)
  })
  .catch((e) => {
    console.error('An Error occured while starting the Server!\n', e)
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

server.on('httpRequest', async(ctr, end) => {
  return console.log(`request made to ${decodeURI(ctr.url.href)} by ${ctr.client.ip}`)
  // you can also end the request here like in validations
})

server.start()
  .then((port) => {
    console.log(`server started on port ${port}`)
  })
  .catch((e) => {
    console.error('An Error occured while starting the Server!\n', e)
  })
```

### Cleaning Up Functions
Load routes from Directory
```js
const { Server } = require('rjweb-server')

const server = new Server({
  bind: '0.0.0.0',
  cors: false,
  port: 5000,
  proxy: true
})

module.exports.server = server // Important! Needed to make route Files

server.path('/', (path) => path
  .loadCJS('./functions') // This loads CJS files (module.exports)
  .loadESM('./functions') // This loads ESM files (export default)
)

server.start()
  .then((port) => {
    console.log(`server started on port ${port}`)
  })
  .catch((e) => {
    console.error('An Error occured while starting the Server!\n', e)
  })
```

Making a route File
```js
const { server } = require('../index.js')

module.exports = new server.routeFile((file) => file
  .http('GET', '/say/<word>', (http) => http
    .onRequest((ctr) => {
      const word = ctr.params.get('word')

      ctr.print(`I will say it!!!!!!!!!\n${word}`)
    })
  )
)
```

### CLI
Serve a Static Folder using CLI
```sh
rjweb serve [path to folder] [arguments]

# Example
rjweb serve ./static --port 4444 --hideHTML
```

Generate a Template using CLI
```sh
rjweb generate [path to destination folder]

# Example
rjweb generate ./chat-app
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