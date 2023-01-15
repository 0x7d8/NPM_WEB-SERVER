<h1 align="center">Welcome to rjweb-server 👋</h1>
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
  if (!ctr.query.has("name")) return ctr.print('please supply the name query!!')

  return ctr.print(`Hello, ${ctr.query.get("name")}! How are you doing?`)
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

interface ctr extends ctrPreset<Custom> {}

const routes = new webserver.routeList()

routes.set(webserver.types.get, '/hello', async(ctr: ctr) => {
  if (!ctr.query.has("name")) return ctr.print('please supply the name query!!')

  return ctr.print(`Hello, ${ctr.query.get("name")}! You are Visit nr.${ctr['@'].count}`)
})

let count = 0
webserver.start({
  bind: '0.0.0.0', // The IP thats bound to
  port: 5000, // The Port which the Server runs on
  urls: routes, // The Routes Object
  events: {
    request: {
      ctr.setCustom('count', ++count) 

      console.log(`request made to ${decodeURI(ctr.reqUrl.pathname)} by ${ctr.hostIp}`)
    }
  }
}).then((res) => {
  console.log(`webserver started on port ${res.port}`)
})
```

## Usage

Initialize Server
```js
const webserver = require('rjweb-server')
const routes = new webserver.routeList()

// ctr.query.get... is ?name=
routes.set(webserver.types.get, '/hello', async(ctr) => {
  if (!ctr.query.has("name")) return ctr.print('please supply the name query!!')

  return ctr.print(`Hello, ${ctr.query.get("name")}! How are you doing?`)
})

// ctr.param.get... is :name, example /hello/0x4096
routes.set(webserver.types.get, '/hello/:name', async(ctr) => {
  return ctr.print(`Hello, ${ctr.param.get("name")}! How are you doing?`)
})

// ctr.param.get... is :name, example /hello/0x4096
routes.set(webserver.types.post, '/post', async(ctr) => {
  return ctr.print(`Hello, ${ctr.reqBody}! How are you doing?`)
})

routes.set(webserver.types.get, '/profile/:user', async(ctr) => {
  ctr.setHeader('Content-Type', 'image/png')
  return ctr.printFile(`../images/profile/${ctr.param.get('user')}.png`)
})

webserver.start({
  bind: '0.0.0.0', // The IP thats bound to
  body: 20, // The Max POST Body in MB
  cors: false, // If Cors Headers will be added
  port: 5000, // The Port which the Server runs on
  urls: routes, // The Routes Object
  proxy: true // If enabled, alternate IPs will be shown
}).then((res) => {
  console.log(`webserver started on port ${res.port}`)
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
  urls: routes,
  proxy: true
}).then((res) => {
  console.log(`webserver started on port ${res.port}`)
})
```

Custom 404 / 500 Page
```js
webserver.start({
  bind: '0.0.0.0',
  cors: false,
  port: port,
  urls: routes,
  proxy: true,
  pages: {
    notFound: async(ctr) {
      ctr.status(404)
      return ctr.print(`page "${ctr.reqUrl.pathname}" not found`)
    }, reqError: async(ctr) => {
      ctr.status(500)
      ctr.print(`ERROR!!! ${ctr.error.message}`)
      return console.log(ctr.error)
    }
  }
}).then((res) => {
  console.log(`webserver started on port ${res.port}`)
})
```

Custom Function on every request
```js
webserver.start({
  bind: '0.0.0.0',
  cors: false,
  port: port,
  urls: routes,
  proxy: true,
  events: {
    request: async(ctr) => {
      return console.log(`request made to ${decodeURI(ctr.reqUrl.pathname)} by ${ctr.hostIp}`) // DO NOT write any data or end the request
    }
  }
}).then((res) => {
  console.log(`webserver started on port ${res.port}`)
})
```

### Rate Limits
With Database (EXAMPLE, PLEASE EDIT)
```js
webserver.start({
  bind: '0.0.0.0',
  cors: false,
  port: port,
  urls: routes,
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
      set: async(key, value) => (await db.query('update ratelimits set value = ? where key = ?;', [value, key])),
      get: async(key) => ((await db.query('select value from ratelimits where key = ?;', [key])).data.rows[0].value),
      del: async(key, value) => (await db.query('delete from ratelimits where key = ?;', [key]))
    }
  }
}).then((res) => {
  console.log(`webserver started on port ${res.port}`)
})
```

With Map
```js
const rateLimits = new Map()

webserver.start({
  bind: '0.0.0.0',
  cors: false,
  port: port,
  urls: routes,
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
  urls: routes,
  proxy: true,
}).then((res) => {
  console.log(`webserver started on port ${res.port}`)
})
```

Making a function File
```js
const webserver = require('rjweb-server')

// For Typescript just use `export =` instead
module.exports = {
  type: webserver.types.get,
  path: '/say/:word',

  async code(ctr) {
    const word = ctr.param.get('word')

    return ctr.print(`I will say it!!!\n${word}`)
  }
}
```

## Full Example

Javascript
https://replit.com/@RobertJansen/aous

Typescript
https://replit.com/@RobertJansen/aous-ts

## Author

👤 **0x4096**

## 🤝 Contributing

Contributions, issues and feature requests are welcome!<br />Feel free to check [issues page](https://github.com/rotvproHD/NPM_WEB-SERVER/issues). 

## Show your support

Give a Star if this project helped you!

## 📝 License

Copyright © 2022 [0x4096](https://github.com/rotvproHD).<br />
This project is ISC licensed.
