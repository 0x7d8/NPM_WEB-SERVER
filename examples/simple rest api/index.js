const webserver = require('rjweb-server')

const routes = new webserver.routeList()
const path = require('path')

routes.load(path.join(__dirname, 'endpoints'))

webserver.start({
  bind: '0.0.0.0',
  cors: false,
  port: 5000,
  routes: routes
}).then((res) => {
  console.log(`api started on port ${res.port}`)
})