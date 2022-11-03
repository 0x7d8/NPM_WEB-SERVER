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

  Easy Way to create a web Server in node.js
</center>

### 🏠 [Homepage](https://github.com/rotvproHD/NPM_WEB-SERVER#readme)

## Install

```sh
npm i rjweb-server
```

## Usage

Initialize Server
```js
/* ************ *
 * EXPERIMENTAL *
 * ************ */
// You shouldnt use the current
// State for Production Use

const webserver = require('rjweb-server')
const routes = new webserver.RouteList()

// ctr.query.get... is ?name=
routes.set(webserver.types.get, '/hello', async(ctr) => {
  if (!ctr.query.has("name")) return ctr.print('please supply the name query!!')

  ctr.print(`Hello, ${ctr.query.get("name")}! How are you doing?`)
})

// ctr.param.get... is :name, example /hello/0x4096
routes.set(webserver.types.get, '/hello/:name', async(ctr) => {
  ctr.print(`Hello, ${ctr.param.get("name")}! How are you doing?`)
})

// ctr.param.get... is :name, example /hello/0x4096
routes.set(webserver.types.post, '/post', async(ctr) => {
  ctr.print(`Hello, ${ctr.reqBody}! How are you doing?`)
})

webserver.start({
  bind: '0.0.0.0',
  cors: false,
  port: 5000,
  urls: routes
}).then((res) => {
  console.log(`webserver started on port ${res.port}`)
})
```

Serve Static Files
```js
/* ************ *
 * EXPERIMENTAL *
 * ************ */
// You shouldnt use the current
// State for Production Use

const webserver = require('rjweb-server')
const routes = new webserver.RouteList()

routes.static('/', './html') // The html folder is in the root directory

webserver.start({
  bind: '0.0.0.0',
  cors: false,
  port: 5000,
  urls: routes
}).then((res) => {
  console.log(`webserver started on port ${res.port}`)
})
```

Custom 404 / 500 Page
```js
/* ************ *
 * EXPERIMENTAL *
 * ************ */
// You shouldnt use the current
// State for Production Use

webserver.start({
  bind: '0.0.0.0',
  cors: false,
  port: port,
  urls: routes,
  pages: {
    notFound: async(ctr) {
      ctr.status(404)
      ctr.print(`page "${ctr.reqUrl.pathname}" not found`)
    }, reqError: async(ctr) => {
      ctr.status(500)
      ctr.print(`ERROR!!! ${ctr.error.message}`)
      console.log(ctr.error)
    }
  }
}).then((res) => {
  console.log(`webserver started on port ${res.port}`)
})
```

Custom Function on every request
```js
/* ************ *
 * EXPERIMENTAL *
 * ************ */
// You shouldnt use the current
// State for Production Use

webserver.start({
  bind: '0.0.0.0',
  cors: false,
  port: port,
  urls: routes,
  events: {
    request: async(ctr) => {
      console.log(`request made to ${decodeURI(ctr.reqUrl.pathname)}`) // DO NOT write any data or end the request
    }
  }
}).then((res) => {
  console.log(`webserver started on port ${res.port}`)
})
```

### Cleaning Up Functions
Load Functions from Directory
```js
/* ************ *
 * EXPERIMENTAL *
 * ************ */
// You shouldnt use the current
// State for Production Use

const webserver = require('rjweb-server')
const routes = new webserver.RouteList()

routes.load('./functions') // The functions folder is in the root directory

webserver.start({
  bind: '0.0.0.0',
  cors: false,
  port: 5000,
  urls: routes
}).then((res) => {
  console.log(`webserver started on port ${res.port}`)
})
```

Making a function File
```js
const webserver = require('rjweb-server')

module.exports = {
  type: webserver.types.get,
  path: '/say/:word',

  async code(ctr) {
    ctr.print(ctr.param.get('word'))
  }
}
```

## Author

👤 **0x4096**

## 🤝 Contributing

Contributions, issues and feature requests are welcome!<br />Feel free to check [issues page](https://github.com/rotvproHD/NPM_WEB-SERVER/issues). 

## Show your support

Give a ⭐️ if this project helped you!

## 📝 License

Copyright © 2022 [0x4096](https://github.com/rotvproHD).<br />
This project is ISC licensed.
