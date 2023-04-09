#!/usr/bin/env node

import { StartError } from "./types/serverEvents"
import { Version, Status } from "."
import Server from "./classes/webServer"

import yargs from "yargs"
import path from "path"
import fs from "fs"

const colors = {
	reset: '\x1b[0m',
	bright: '\x1b[1m',
	dim: '\x1b[2m',
	underscore: '\x1b[4m',
	blink: '\x1b[5m',
	reverse: '\x1b[7m',
	hidden: '\x1b[8m',
	fg: {
		black: '\x1b[30m',
		red: '\x1b[31m',
		green: '\x1b[32m',
		yellow: '\x1b[33m',
		blue: '\x1b[34m',
		magenta: '\x1b[35m',
		cyan: '\x1b[36m',
		white: '\x1b[37m',
		gray: '\x1b[90m',
	}, bg: {
		black: '\x1b[40m',
		red: '\x1b[41m',
		green: '\x1b[42m',
		yellow: '\x1b[43m',
		blue: '\x1b[44m',
		magenta: '\x1b[45m',
		cyan: '\x1b[46m',
		white: '\x1b[47m',
		gray: '\x1b[100m',
		crimson: '\x1b[48m'
	}
}

const prefix = `⚡  ${colors.fg.white}[RJWEB ${Version.split('.')[0]}]${colors.fg.gray}:${colors.reset}`

const coloredPath = (path: string) => {
	let output: string[] = []
	for (const part of path.split('/')) {
		output.push(`${colors.fg.blue}${part}`)
	}

	return output.join(`${colors.fg.cyan}/`)
}

const pR = (location: string) => {
	return path.join(process.cwd(), location)
}

const isX = (type: 'dir' | 'file', path: string) => {
	let infos: fs.Stats
	try {
		infos = fs.statSync(path)
	} catch {
		return false
	}

	if (type === 'dir') return infos.isDirectory()
	else return infos.isFile()
} 

yargs
	.scriptName('rjweb')
	.usage('$0 <command> [args]')
	.version(Version)
	.command(
		'serve <folder>',
		'Serve a Folder',
		((cmd) => cmd
			.positional('folder', {
				type: 'string',
				description: 'The Folder to serve',
			})
			.option('port', {
				type: 'number',
				description: 'The port on which to serve',
				alias: ['p'],
				default: 8080,
			})
			.option('hideHTML', {
				type: 'boolean',
				description: 'Whether to remove html file endings',
				alias: ['html', 'h', 'hH'],
				default: false,
			})
			.option('compress', {
				type: 'boolean',
				description: 'Whether to compress outgoing data with gzip',
				alias: ['C'],
				default: false,
			})
			.option('cors', {
				type: 'boolean',
				description: 'Whether to enable * CORS headers',
				alias: ['c'],
				default: false,
			})
			.option('proxy', {
				type: 'boolean',
				description: 'Whether to enable using X-Forwarded-For Header',
				alias: ['P'],
				default: false,
			})
			.option('bind', {
				type: 'string',
				description: 'Where to bind the Server to',
				alias: ['b'],
				default: '0.0.0.0',
			})
			.option('404-file', {
				type: 'string',
				description: 'The file to print when a route is not found',
				alias: ['404'],
				default: '',
			})
			.option('dashboard', {
				type: 'boolean',
				description: 'Whether to enable the built-in dashboard (/rjweb-dashboard)',
				alias: ['d', 'dash'],
				default: false,
			})
			.option('dashboard-password', {
				type: 'string',
				description: 'The password for the dashboard',
				alias: ['dP', 'pass'],
				default: '',
			})
		),
		((args) => {
			if (!isX('dir', pR(args.folder ?? '//'))) return console.error(`${prefix} ${colors.fg.red}Couldnt find ${colors.fg.cyan}${args.folder}`)
			if (args["404File"] && !isX('file', pR(args["404File"] ?? '//'))) return console.error(`${prefix} ${colors.fg.red}Couldnt find ${colors.fg.cyan}${args["404File"]}`)

			const server = new Server({
				port: args.port,
				dashboard: {
					enabled: args.dashboard,
					password: args.dashboardPassword,
				}, compression: args.compress ? 'gzip' : 'none',
				cors: args.cors,
				proxy: args.proxy,
				bind: args.bind,
			})

			server.path('/', (path) => path
				.static(pR(args.folder!), {
					hideHTML: args.hideHTML
				})
			)

			server.event('httpRequest', (ctr) => {
				console.log(`${prefix} ${colors.fg.gray}${ctr.client.ip} ${colors.fg.green}HTTP ${ctr.url.method} ${colors.fg.cyan}${coloredPath(ctr.url.path)}`)
			})

			if (args["404File"]) server.event('http404', (ctr) => {
				ctr.status(Status.NOT_FOUND).printFile(pR(args["404File"]))
			})

			server.start()
				.then((s) => {
					console.log(`${prefix} ${colors.fg.green}Started on Port ${colors.fg.cyan}${s.port}`)
				})
				.catch((err: StartError) => {
					console.error(`${prefix} ${colors.fg.red}An Error occured while starting the Server:`)
					console.error(`${colors.fg.cyan}${err.error.stack}`)
					process.exit(1)
				})
		})
	)
	.help()
	.argv