<h1 align="center">Welcome to rjweb-server 👋</h1>
<center>
  <a href="https://www.npmjs.com/package/rjweb-server" target="_blank">
    <img alt="Version" src="https://img.shields.io/npm/v/web-server.svg">
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
  ctr.print(`Hello, ${ctr.query.get("name")}! How are you doing?`)
})

const port = 5000
webserver.start({
  bind: '0.0.0.0',
  port: port,
  urls: routes
}).then((res) => {
  console.log(`webserver started on port ${res.port}`)
})
```

Custom Not found page
```js
/* ************ *
 * EXPERIMENTAL *
 * ************ */
// You shouldnt use the current
// State for Production Use

webserver.start({
  bind: '0.0.0.0',
  port: port,
  urls: routes,
  notfound: async(ctr) {
    ctr.status(404)
    ctr.print(`page "${ctr.requestPath.pathname}" not found`)
  }
}).then((res) => {
  console.log(`webserver started on port ${res.port}`)
})
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
