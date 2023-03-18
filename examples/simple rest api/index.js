const { Server } = require('rjweb-server')
const path = require('path')

const server = new Server({
	bind: '0.0.0.0',
	cors: true,
	port: 5000
})

server.prefix('/')
	.loadCJS(path.join(__dirname, 'endpoints'))

server.start().then((res) => {
	console.log(`api started on port ${res.port}`)
})