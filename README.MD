<h1 align="center">Welcome to rjweb-server v2 👋</h1>
<center>
  <a href="https://www.npmjs.com/package/rjweb-server" target="_blank">
    <img alt="Version" src="https://img.shields.io/npm/v/rjweb-server.svg">
  </a>
  <a href="https://github.com/rotvproHD/NPM_WEB-SERVER#readme" target="_blank">
    <img alt="Documentation" src="https://img.shields.io/badge/documentation-yes-brightgreen.svg" />
  </a>
  <a href="https://github.com/rotvproHD/NPM_WEB-SERVER/graphs/commit-activity" target="_blank">
    <img alt="Maintenance" src="https://img.shields.io/badge/Maintained%3F-yes-green.svg" />
  </a>

  Easy and Lightweight Way to create a Web Server in Node.js
</center>

### 🏠 [Homepage](https://github.com/rotvproHD/NPM_WEB-SERVER#readme)

## Install

```sh
npm i rjweb-server
```

or

```sh
yarn add rjweb-server
```

or

```sh
pnpm add rjweb-server
```

## Typescript

Importing
```ts
import * as webserver from "rjweb-server"
```

Interface for ctr Object
```ts
import { ctr } from "rjweb-server/interfaces"

const routes = new webserver.routeList()

routes.set(webserver.types.get, '/hello', async(ctr: ctr) => {
  if (!ctr.queries.has("name")) return ctr.print('please supply the name queries!!')

  return ctr.print(`Hello, ${ctr.queries.get("name")}! How are you doing?`)
})

// ...
```

Custom Properties in Ctr Object
(This also works in JavaScript, just remove the interface logic)
```ts
import * as webserver from "rjweb-server"
import { ctr as ctrPreset } from "rjweb-server/interfaces"
interface Custom {
  count: number
}

interface ctr<HasError = false, Body = any> extends ctrPreset<Custom, HasError, Body> {}

const routes = new webserver.routeList()

routes.set(webserver.types.get, '/hello', async(ctr: ctr) => {
  if (!ctr.queries.has("name")) return ctr.print('please supply the name queries!!')

  return ctr.print(`Hello, ${ctr.queries.get("name")}! You are Visit nr.${ctr['@'].count}`)
})

let count = 0
routes.event('request', async(ctr: ctr) => {
  ctr.setCustom('count', ++count) 

  console.log(`request made to ${decodeURI(ctr.url.pathname)} by ${ctr.client.ip}`)
})

routes.event('error', async(ctr: ctr<true>) => {
  console.log(`error on path ${decodeURI(ctr.url.pathname)}!!!`)
  console.error(ctr.error.stack)

  ctr.status(500)
  ctr.print('server error')
})

webserver.start({
  bind: '0.0.0.0', // The IP thats bound to
  port: 5000, // The Port which the Server runs on
  routes: routes // The Routes Object
}).then((res) => {
  console.log(`webserver started on port ${res.port}`)
})
```

## Usage

Initialize Server
```js
const webserver = require('rjweb-server')
const routes = new webserver.routeList()

// ctr.queries.get... is ?name=
routes.set(webserver.types.get, '/hello', async(ctr) => {
  if (!ctr.queries.has("name")) return ctr.print('please supply the name Query!!')

  return ctr.print(`Hello, ${ctr.queries.get("name")}! How are you doing?`)
})

// ctr.params.get... is :name, example /hello/0x4096
routes.set(webserver.types.get, '/hello/:name', async(ctr) => {
  return ctr.print(`Hello, ${ctr.params.get("name")}! How are you doing?`)
})

// ctr.params.get... is :name, example /hello/0x4096
routes.set(webserver.types.post, '/post', async(ctr) => {
  return ctr.print(`Hello, ${ctr.body}! How are you doing?`)
})

routes.set(webserver.types.get, '/profile/:user', async(ctr) => {
  ctr.setHeader('Content-Type', 'image/png')
  return ctr.printFile(`../images/profile/${ctr.params.get('user')}.png`)
})

webserver.start({
  bind: '0.0.0.0', // The IP thats bound to
  body: 20, // The Max POST Body in MB
  cors: false, // If Cors Headers will be added
  port: 5000, // The Port which the Server runs on
  routes: routes, // The Routes Object
  proxy: true // If enabled, alternate IPs will be shown
}).then((res) => {
  console.log(`webserver started on port ${res.port}`)
}).catch((err) => {
  console.log(err)
})
```

Serve Static Files
```js
const webserver = require('rjweb-server')
const routes = new webserver.routeList()

routes.static('/', './html', {
  preload: false, // If enabled will load every static files content into Memory
  remHTML: true // If enabled will remove the html ending from files when serving
}) // The html folder is in the root directory

webserver.start({
  bind: '0.0.0.0',
  cors: false,
  port: 5000,
  routes: routes,
  proxy: true
}).then((res) => {
  console.log(`webserver started on port ${res.port}`)
}).catch((err) => {
  console.log(err)
})
```

Custom Not Found / Server Error Page
```js
const routes = new webserver.routeList()

routes.event('notfound', async(ctr) => {
  ctr.status(404)
  return ctr.print(`page "${ctr.url.pathname}" not found`)
})

routes.event('error', async(ctr) => {
  ctr.status(500)
  ctr.print(`ERROR!!! ${ctr.error.message}`)
  return console.log(ctr.error)
})

webserver.start({
  bind: '0.0.0.0',
  cors: false,
  port: port,
  routes: routes,
  proxy: true
}).then((res) => {
  console.log(`webserver started on port ${res.port}`)
}).catch((err) => {
  console.log(err)
})
```

Custom Function on every request
```js
const routes = new webserver.routeList()

routes.event('request', async(ctr) => {
  return console.log(`request made to ${decodeURI(ctr.url.href)} by ${ctr.client.ip}`)
  // DO NOT write any data or end the request
})

webserver.start({
  bind: '0.0.0.0',
  cors: false,
  port: port,
  routes: routes,
  proxy: true
}).then((res) => {
  console.log(`webserver started on port ${res.port}`)
}).catch((err) => {
  console.log(err)
})
```

### Rate Limits
With Database (EXAMPLE, PLEASE EDIT)
```js
webserver.start({
  bind: '0.0.0.0',
  cors: false,
  port: port,
  routes: routes,
  proxy: true,
  rateLimits: {
    enabled: true,
    message: 'You are being rate limited',
    list: [
      {
        path: '/auth',
        times: 5,
        timeout: 10000
      },
      {
        path: '/fetch',
        times: 3,
        timeout: 5000
      }
    ], functions: {
      set: async(key, value) => (await db.queries('update ratelimits set value = ? where key = ?;', [value, key])),
      get: async(key) => ((await db.queries('select value from ratelimits where key = ?;', [key])).data.rows[0].value)
    }
  }
}).then((res) => {
  console.log(`webserver started on port ${res.port}`)
}).catch((err) => {
  console.log(err)
})
```

With Map
```js
const rateLimits = new Map()

webserver.start({
  bind: '0.0.0.0',
  cors: false,
  port: port,
  routes: routes,
  proxy: true,
  rateLimits: {
    enabled: true,
    message: 'You are being rate limited',
    list: [
      {
        path: '/auth',
        times: 5,
        timeout: 10000
      },
      {
        path: '/fetch',
        times: 3,
        timeout: 5000
      }
    ], functions: rateLimits
  }
}).then((res) => {
  console.log(`webserver started on port ${res.port}`)
}).catch((err) => {
  console.log(err)
})
```

### Cleaning Up Functions
Load Functions from Directory
```js
const webserver = require('rjweb-server')
const routes = new webserver.routeList()

routes.load('./functions') // The functions folder is in the root directory

webserver.start({
  bind: '0.0.0.0',
  cors: false,
  port: 5000,
  routes: routes,
  proxy: true,
}).then((res) => {
  console.log(`webserver started on port ${res.port}`)
}).catch((err) => {
  console.log(err)
})
```

Making a function File
```js
const webserver = require('rjweb-server')

// For Typescript just use `export =` instead
module.exports = {
  method: webserver.types.get,
  path: '/say/:word',

  async code(ctr) {
    const word = ctr.params.get('word')

    return ctr.print(`I will say it!!!\n${word}`)
  }
}
```

## Full Example

### Javascript
https://replit.com/@RobertJansen/aous

### Typescript
https://replit.com/@RobertJansen/aous-ts

## Author

👤 **0x4096**

## 🤝 Contributing

Contributions, issues and feature requests are welcome!<br />Feel free to check [issues page](https://github.com/rotvproHD/NPM_WEB-SERVER/issues). 

## Show your support

Give a Star if this project helped you!

## 📝 License

Copyright © 2023 [0x4096](https://github.com/rotvproHD).<br />
This project is MIT licensed.
