const webserver = require('rjweb-server')

const routes = new webserver.routeList()
const path = require('path')

routes.static(path.join(__dirname, 'static'))

webserver.start({
	bind: '0.0.0.0',
	cors: false,
	port: 5000,
	routes: routes
}).then((res) => {
	console.log(`website started on port ${res.port}`)
})