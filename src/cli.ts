#!/usr/bin/env node

import * as fs from "fs"
import * as path from "path"
import { Options } from "./classes/serverOptions"
import webserver from "."

// @ts-ignore
import packageJSON from "./package.json"

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
	let remHTML = false, addTypes = true, notFoundPath = '', refreshInterval = -1
	for (const option of args.slice(1)) {
		const [ key, value ] = option.slice(2).split('=')

		if (key === 'port') webserverOptions.port = Number(value)
		if (key === 'bind') webserverOptions.bind = value
		if (key === 'remHTML') remHTML = Boolean(value)
		if (key === 'addTypes') remHTML = Boolean(value)
		if (key === 'compression') webserverOptions.compression = value as any
		if (key === 'cors') webserverOptions.cors = Boolean(value)
		if (key === 'proxy') webserverOptions.proxy = Boolean(value)
		if (key === 'dashboard') webserverOptions.dashboard.enabled = Boolean(value)
		if (key === 'refresh') refreshInterval = Number(value)
		if (key === '404') notFoundPath = String(value).replaceAll('"', '')
	}

	if (refreshInterval !== -1) setInterval(() => {
		console.log(`${colors.fg.yellow}[RJW] ${colors.reset}Reloading Server...`)

		const routes = new webserver.routeList()
		routes.routeBlock('/').static(path.join(process.cwd(), args[0]), { hideHTML: remHTML, addTypes })
		if (notFoundPath) routes.event('notfound', async(ctr) => {
			return ctr.status(404).printFile(path.join(process.cwd(), notFoundPath))
		}); routes.event('request', async(ctr) => {
			console.log(`${colors.fg.yellow}[RJW] ${colors.fg.gray}[${ctr.url.method}] ${colors.fg.blue, colors.underscore}${ctr.url.href}${colors.reset} FROM ${ctr.client.ip}`)
		}); controller.setRoutes(routes)
		controller.reload(false).then(() => {
			console.log(`${colors.fg.yellow}[RJW] ${colors.reset}Server automatically reloaded and started on Port ${colors.fg.yellow}${webserverOptions.port ?? 2023}${colors.reset}`)
		})
	}, refreshInterval * 1000)

	const routes = new webserver.routeList()
	routes.routeBlock('/').static(path.join(process.cwd(), args[0]), { hideHTML: remHTML, addTypes })
	if (notFoundPath) routes.event('notfound', async(ctr) => {
		return ctr.status(404).printFile(path.join(process.cwd(), notFoundPath))
	}); routes.event('request', async(ctr) => {
		console.log(`${colors.fg.yellow}[RJW] ${colors.fg.gray}[${ctr.url.method}] ${colors.fg.blue, colors.underscore}${ctr.url.href}${colors.reset} FROM ${ctr.client.ip}`)
	}); const controller = webserver.initialize(webserverOptions as Options)
		controller.setRoutes(routes).start().then((res) => {
			console.log(`${colors.fg.yellow}[RJW] ${colors.reset}Server started on Port ${colors.fg.yellow}${res.port}${colors.reset}`)

			// CLI Commands
			const stdin = process.openStdin()
			stdin.addListener('data', (input) => {
				// Get Arguments
				const cmdArgs = input.toString().trim().split(' ')

				// RELOAD
				if (cmdArgs[0].toUpperCase() === 'RELOAD') {
					console.log(`${colors.fg.yellow}[RJW] ${colors.reset}Reloading Server...`)

					const routes = new webserver.routeList()
					routes.routeBlock('/').static(path.join(process.cwd(), args[0]), { hideHTML: remHTML, addTypes })
					if (notFoundPath) routes.event('notfound', async(ctr) => {
						return ctr.status(404).printFile(path.join(process.cwd(), notFoundPath))
					}); routes.event('request', async(ctr) => {
						console.log(`${colors.fg.yellow}[RJW] ${colors.fg.gray}[${ctr.url.method}] ${colors.fg.blue, colors.underscore}${ctr.url.href}${colors.reset} FROM ${ctr.client.ip}`)
					}); controller.setRoutes(routes)
					controller.reload(cmdArgs[1] === '-y').then(() => {
						console.log(`${colors.fg.yellow}[RJW] ${colors.reset}Server reloaded and started on Port ${colors.fg.yellow}${res.port}${colors.reset}`)
					})
				}
			})
		}).catch((err) => {
			console.log(`${colors.fg.yellow}[RJW] ${colors.reset}Error:`)
			console.log(`${colors.fg.yellow}[RJW] ${colors.reset}Maybe Port ${colors.fg.yellow}${webserverOptions.port ?? 2023}${colors.reset} isnt available?`)
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
	console.log(' --compression=gzip')
	console.log(' --proxy=false')
	console.log(' --cors=false')
	console.log(' --bind=0.0.0.0')
	console.log(' --remHTML=false')
	console.log(' --addTypes=true')
	console.log(' --dashboard=false')
	console.log(' --refresh=100')
	console.log(' --404="static/404.html"')
}