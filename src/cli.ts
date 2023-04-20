#!/usr/bin/env node

import { StartError } from "./types/serverEvents"
import { Version, Status } from "."
import Server from "./classes/webServer"

import https from "https"
import yargs from "yargs"
import pPath from "path/posix"
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

type GitFile = {
	name: string
	path: string
	sha: string
	content?: string
	size: number
	url: string
	html_url: string
	git_url: string
	download_url: string | null
	type: 'file' | 'dir' | 'submodule'
}

type Template = {
	name: string
	variants: {
		name: string
		git: GitFile
	}[]
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
				demandOption: true
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

			server.on('httpRequest', (ctr) => {
				console.log(`${prefix} ${colors.fg.gray}${ctr.client.ip} ${colors.fg.green}HTTP ${ctr.url.method} ${colors.fg.cyan}${coloredPath(ctr.url.path)}`)
			})

			if (args["404File"]) server.on('route404', (ctr) => {
				ctr.status(Status.NOT_FOUND).printFile(pR(args["404File"]))
			})

			server.start()
				.then((s) => {
					console.log(`${prefix} ${colors.fg.green}Started on Port ${colors.fg.cyan}${s.port}`)
				})
				.catch((err: StartError) => {
					console.error(`${prefix} ${colors.fg.red}An Error occured while starting the Server:`)
					console.error(`${colors.fg.cyan}${err.stack}`)
					process.exit(1)
				})
		})
	)
	.command(
		'generate <folder>',
		'Generate a template Project',
		((cmd) => cmd
			.positional('folder', {
				type: 'string',
				description: 'The Folder to generate the template in',
				demandOption: true
			})
			.option('template', {
				type: 'string',
				description: 'Which template to use',
				alias: ['E'],
				default: 'choose',
			})
			.option('variant', {
				type: 'string',
				description: 'The Variant of the template to use',
				alias: ['V'],
				default: 'choose',
			})
		),
		(async(args) => {
			const { default: inquirer } = await import('inquirer')

			console.log(`${prefix} ${colors.fg.gray}Fetching Examples from GitHub...`)
			const templates: Template[] = []
			;(JSON.parse((await new Promise<Buffer>((resolve, reject) => {
				const chunks: Buffer[] = []
				https.get({
					path: '/repos/rotvproHD/NPM_WEB-SERVER/contents/templates',
					host: 'api.github.com',
					port: 443,
					headers: {
						"User-Agent": 'NPM_WEB-SERVER',
						"Accept": 'application/vnd.github.v3+json',
					}
				}, (res) => {
					res.on('data', (data) => {
						chunks.push(data)
					}).once('error', reject)
					.once('end', () => {
						resolve(Buffer.concat(chunks))
					})
				})
			})).toString()) as GitFile[]).filter((t) => t.type === 'dir').forEach((template) => {
				const variant = template.name.match(/\[.*\] /)![0].replace(/\[|\]/g, '').trim()
				const name = template.name.replace(/\[.*\] /, '')

				if (templates.some((t) => t.name === name)) {
					const index = templates.findIndex((t) => t.name === name)

					templates[index].variants.push({
            name: variant,
            git: template
          })
				} else {
					templates.push({
            name,
            variants: [
							{
              	name: variant,
              	git: template
            	}
						]
          })
				}
			})

			let template = '', variant = ''
			if (args.template !== 'choose' && templates.some((t) => t.name === args.template)) {
				template = args.template
				console.log(`${prefix} ${colors.fg.gray}Using ${colors.fg.cyan}${template}`)
			} else {
				if (args.template !== 'choose') console.log(`${prefix} ${colors.fg.cyan}${args.template} ${colors.fg.red}is not a valid template!`)
				await inquirer.prompt([
					{
						name: 'Template',
						type: 'list',
						prefix,
						choices: templates.map((t) => t.name),
						askAnswered: true
					}
				]).then((answers) => {
					template = answers.Template
				})
			}

			if (args.variant !== 'choose' && templates.some((t) => t.name === args.variant)) {
				variant = args.variant
				console.log(`${prefix} ${colors.fg.gray}Using Variant ${colors.fg.cyan}${variant}`)
			} else {
				if (args.variant !== 'choose') console.log(`${prefix} ${colors.fg.cyan}${args.template} ${colors.fg.red}is not a valid template!`)
				await inquirer.prompt([
					{
						name: 'Variant',
						type: 'list',
						prefix,
						choices: templates.find((t) => t.name === template)!.variants.map((v) => v.name),
						askAnswered: true
					}
				]).then((answers) => {
					variant = answers.Variant
				})
			}

			if (!fs.existsSync(path.join(process.cwd(), args.folder))) {
				await fs.promises.mkdir(path.join(process.cwd(), args.folder))
			}

			console.log(`${prefix} ${colors.fg.gray}Generating Template Project...`)
			const handleDirectory = async(directory: string) => {
				const files: GitFile | GitFile[] = JSON.parse((await new Promise<Buffer>((resolve, reject) => {
					const chunks: Buffer[] = []
					https.get({
						path: new URL(directory).pathname,
						host: 'api.github.com',
						port: 443,
						headers: {
							"User-Agent": 'NPM_WEB-SERVER',
							"Accept": 'application/vnd.github.v3+json',
						}
					}, (res) => {
						res.on('data', (data) => {
							chunks.push(data)
						}).once('error', reject)
						.once('end', () => {
							resolve(Buffer.concat(chunks))
						})
					})
				})).toString())

				if (Array.isArray(files)) {
					for (const file of files) {
						if (file.type === 'dir') {
							await fs.promises.mkdir(pPath.join(process.cwd(), args.folder, file.path.replace(`templates/[${variant}] ${template}`, '')))
						}

						await handleDirectory(file.url)
					}
				} else {
					const file = files

					console.log(`${prefix} ${colors.fg.green}Downloaded ${colors.fg.cyan}${pPath.join(args.folder, file.name)}`)
					await fs.promises.writeFile(path.join(process.cwd(), args.folder, file.path.replace(`templates/[${variant}] ${template}`, '')), Buffer.from(file.content!, 'base64').toString())
				}
			}

			await handleDirectory(templates.find((t) => t.name === template)!.variants.find((v) => v.name === variant)!.git.url)

			console.log('')
			console.log(`${prefix} ${colors.fg.green}Template Project Generated!${colors.reset}`)
		})
	)
	.help()
	.argv