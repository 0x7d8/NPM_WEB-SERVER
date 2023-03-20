#!/usr/bin/env node

import { Options } from "./classes/serverOptions"
import Server from "./classes/webServer"

import path from "path"
import fs from "fs"

/** @ts-ignore */ 
import { version } from "./pckg.json"

const colors = {
	reset: "\x1b[0m",
	bright: "\x1b[1m",
	dim: "\x1b[2m",
	underscore: "\x1b[4m",
	blink: "\x1b[5m",
	reverse: "\x1b[7m",
	hidden: "\x1b[8m",
	fg: {
		black: "\x1b[30m",
		red: "\x1b[31m",
		green: "\x1b[32m",
		yellow: "\x1b[33m",
		blue: "\x1b[34m",
		magenta: "\x1b[35m",
		cyan: "\x1b[36m",
		white: "\x1b[37m",
		gray: "\x1b[90m",
	}, bg: {
		black: "\x1b[40m",
		red: "\x1b[41m",
		green: "\x1b[42m",
		yellow: "\x1b[43m",
		blue: "\x1b[44m",
		magenta: "\x1b[45m",
		cyan: "\x1b[46m",
		white: "\x1b[47m",
		gray: "\x1b[100m",
		crimson: "\x1b[48m"
	}
}

const isHelp = () => (!args[0] || args.includes('-h') || args.includes('--help'))

const webserverOptions: Partial<Options> = { dashboard: {} }
const args = process.argv.slice(2)
if (args.includes('-v') || args.includes('--version')) {
	console.log(`${colors.fg.blue}[INF] ${colors.reset}Version:`)
	console.log(`${version}`)
} else if (!isHelp() && fs.existsSync(path.join(process.cwd(), args[0]))) {
	let hideHTML = false, notFoundPath = ''
	for (const option of args.slice(1)) {
		const [ key, value ] = option.slice(2).split('=')

		if (key === 'port') webserverOptions.port = Number(value)
		if (key === 'bind') webserverOptions.bind = value
		if (key === 'hideHTML') hideHTML = true
		if (key === 'compression') webserverOptions.compression = value as any
		if (key === 'cors') webserverOptions.cors = true
		if (key === 'proxy') webserverOptions.proxy = true
		if (key === 'dashboard') webserverOptions.dashboard.enabled = true
		if (key === '404') notFoundPath = String(value).replace(/"|'+/g, '')
	}

	const server = new Server(webserverOptions)
	server.path('/', (r) => r
		.static(path.join(process.cwd(), args[0]), { hideHTML })
	)

	if (notFoundPath) server.event('http404', (ctr) => {
		return ctr.status(404).printFile(path.join(process.cwd(), notFoundPath))
	})

	server.event('httpRequest', (ctr) => {
		console.log(`${colors.fg.blue}[INF] ${colors.fg.cyan}[${ctr.url.method}] ${colors.fg.gray}${ctr.url.href}${colors.reset} FROM ${ctr.client.ip}`)
	})

	server.start().then((res) => {
		console.log(`${colors.fg.blue}[INF] ${colors.reset}Server started on Port ${colors.fg.yellow}${res.port}${colors.reset}`)
	}).catch((err) => {
		console.log(`${colors.fg.blue}[INF] ${colors.fg.red}An Error occurred!`)
		console.log(`${colors.fg.red}[ERR] ${colors.fg.gray}Maybe Port ${colors.fg.yellow}${webserverOptions.port ?? 2023}${colors.fg.gray} isnt available?`)
		console.error(`${colors.fg.red}[ERR]${colors.fg.gray}`, err.error)

		process.exit(3)
	})
} else if (!isHelp() && !fs.existsSync(path.join(process.cwd(), args[0]))) {
	console.log(`${colors.fg.blue}[INF] ${colors.fg.red}An Error occurred!`)
	console.log(`${colors.fg.red}[ERR] ${colors.fg.gray}Folder ${colors.fg.red, colors.underscore}${path.join(process.cwd(), args[0])}${colors.reset} couldnt be found`)
}

/** Last Resort */
else {
	console.log(`${colors.fg.blue}[INF] ${colors.reset}Help`)
	console.log(`rjw-srv ${colors.fg.blue}[folder]`)
	console.log('')
	console.log(`${colors.fg.gray}[arguments] ${colors.reset}`)
	console.log(' --port=2023')
	console.log(' --compression=gzip')
	console.log(' --proxy')
	console.log(' --cors')
	console.log(' --bind=0.0.0.0')
	console.log(' --hideHTML')
	console.log(' --dashboard')
	console.log(' --404="static/404.html"')
}