const { Server } = require('rjweb-server')
const path = require('path')

const server = new Server({
	bind: '0.0.0.0',
	cors: false,
	port: 5000
})

server.prefix('/')
	.static(path.join(__dirname, 'static'), {
		hideHTML: true
	})

server.start().then((res) => {
	console.log(`website started on port ${res.port}`)
})