const webserver = require('rjweb-server')
const routes = new webserver.RouteList()
const path = require('node:path')

routes.load(path.join(__dirname, 'endpoints'))

webserver.start({
  bind: '0.0.0.0',
  cors: false,
  port: 5000,
  urls: routes
}).then((res) => {
  console.log(`api started on port ${res.port}`)
})