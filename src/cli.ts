#!/usr/bin/env node

import * as fs from "fs"
import * as path from "path"
import * as packageJSON from "package.json"
import { Options } from "./classes/serverOptions"
import webserver from "."

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
	console.log(`${colors.fg.yellow}[RJW] ${colors.reset}Version:`)
	console.log(`v${packageJSON.version}`)
} else if (!isHelp() && fs.existsSync(path.join(process.cwd(), args[0]))) {
	let remHTML = false, addTypes = true
	for (const option of args.slice(1)) {
		const [ key, value ] = option.slice(2).split('=')

		if (key === 'port') webserverOptions.port = Number(value)
		if (key === 'bind') webserverOptions.bind = value
		if (key === 'remHTML') remHTML = Boolean(value)
		if (key === 'addTypes') remHTML = Boolean(value)
		if (key === 'compress') webserverOptions.compress = Boolean(value)
		if (key === 'dashboard') webserverOptions.dashboard.enabled = Boolean(value)
	}

	webserverOptions.routes = new webserver.routeList()
	webserverOptions.routes.static('/', path.join(process.cwd(), args[0]), { remHTML, addTypes })
	webserverOptions.routes.event('request', async(ctr) => {
		console.log(`${colors.fg.yellow}[RJW] ${colors.fg.gray}[${ctr.url.method}] ${colors.fg.blue, colors.underscore}${ctr.url.href}${colors.reset} FROM ${ctr.client.ip}`)
	}); webserver.start(webserverOptions as Options).then((res) => {
		console.log(`${colors.fg.yellow}[RJW] ${colors.reset}Server started on ${colors.fg.yellow}${res.port}${colors.reset}`)
	}).catch((err) => {
		console.log(`${colors.fg.yellow}[RJW] ${colors.reset}Error:`)
		console.log(`${colors.fg.yellow}[RJW] ${colors.reset}Maybe port ${colors.fg.yellow}${webserverOptions.port ?? 2023}${colors.reset} isnt available`)
		console.error(`${colors.fg.red}[ERR]${colors.reset}`, err.error)
	})
} else if (!isHelp() && !fs.existsSync(path.join(process.cwd(), args[0]))) {
	console.log(`${colors.fg.yellow}[RJW] ${colors.reset}Error:`)
	console.log(`Folder ${colors.fg.red, colors.underscore}${path.join(process.cwd(), args[0])}${colors.reset} couldnt be found`)
}

/** Last Resort */
else {
	console.log(`${colors.fg.yellow}[RJW] ${colors.reset}Help:`)
	console.log(`rjw-srv ${colors.fg.blue}[folder] ${colors.fg.red}[arguments]`)
	console.log('')
	console.log(`[arguments] ${colors.reset}`)
	console.log(' --port=2023')
	console.log(' --compress=false')
	console.log(' --bind=0.0.0.0')
	console.log(' --remHTML=false')
	console.log(' --addTypes=true')
	console.log(' --dashboard=false')
}