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
const urls = new webserver.RouteList()

// ctr.query.get... is ?name=
urls.set('/hello', async(ctr) => {
  ctr.print(`hello, ${ctr.query.get("name")}!`)
})

const port = 5000
webserver.start(port, urls).then(() => {
  console.log(`webserver started on port ${port}`)
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
