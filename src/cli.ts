#! /usr/bin/env node

import { colors } from "@/classes/Logger"
import { Server, defaultOptions, version } from "@/index"
import { exec, execSync } from "child_process"
import https from "https"
import yargs from "yargs"
import pPath from "path/posix"
import path from "path"
import fs from "fs"
import { object } from "@rjweb/utils"

class Spinner {
	private current = 0
	private readonly spinner = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']

	public get(): string {
		this.current = (this.current + 1) % this.spinner.length

		return this.spinner[this.current]
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

type PackageManager = 'npm' | 'yarn' | 'pnpm' | 'bun'

const prefix = `⚡  ${colors.fg.white}[RJWEB ${version.split('.')[0]}]${colors.fg.gray}:${colors.reset}`

const getAllOptionKeys = (options: Record<string, any>): string[] => {
	return Object.keys(options).map((key) => {
		if (typeof options[key] === 'object' && !Array.isArray(options[key])) return getAllOptionKeys(options[key]).map((k) => `${key}.${k}`)
		else return key
	}).flat()
}

const resolveOptionKey = (key: string) => {
	const parts = key.split('.')
	let options = defaultOptions

	for (const part of parts) {
		options = (options as any)[part]
	}

	return options
}

const optionKeyValueToObject = (keys: Record<string, any>) => {
	let output: Record<string, any> = {}
	for (const key in keys) {
		const parts = key.split('.')
		let current = output

		for (let i = 0; i < parts.length; i++) {
			if (i === parts.length - 1) {
				current[parts[i]] = keys[key]
			} else {
				if (!current[parts[i]]) current[parts[i]] = {}
				current = current[parts[i]]
			}
		}
	}

	return output
}

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
	.version(version)
	.command(
		'serve <folder>',
		'Serve a Folder',
		// @ts-ignore
		((cmd) => {
			cmd
				.positional('folder', {
					type: 'string',
					description: 'The Folder to serve',
					demandOption: true
				})
				.option('runtime', {
					type: 'string',
					description: 'The Runtime Package to use',
					alias: ['r'],
					default: '@rjweb/runtime-node',
					demandOption: true
				})
				.option('stripHtmlEnding', {
					type: 'boolean',
					description: 'Strip the .html Ending from Files',
					alias: ['s'],
					default: true
				})
		
			for (const key of getAllOptionKeys(defaultOptions)) {
				if (key === 'version') continue

				cmd.option(key, {
					description: `The ${key} Option`,
					type: typeof resolveOptionKey(key) === 'object' ? 'array' : typeof resolveOptionKey(key)
				})
			}

			return cmd
		}),
		(async(args: { folder: string, runtime: string, stripHtmlEnding: boolean }) => {
			if (!isX('dir', pR(args.folder ?? '//'))) return console.error(`${prefix} ${colors.fg.red}Could not find ${colors.fg.cyan}${args.folder}`)

			const serverOptions = getAllOptionKeys(defaultOptions).reduce((acc, key) => {
				acc[key] = (args as any)[key] ?? resolveOptionKey(key)

				return acc
			}, {} as any)

			console.log(`${prefix} ${colors.fg.gray}Starting Server...`)
			const server = new Server(await import(args.runtime).then((runtime) => runtime.Runtime).catch(() => {
				console.error(`${prefix} ${colors.fg.red}Could not find Runtime Package ${colors.fg.cyan}${args.runtime} ${colors.fg.red}installed globally.`)
				process.exit(1)
			}), optionKeyValueToObject(serverOptions))

			server.path('/', (path) => path
				.static(pR(args.folder), {
					stripHtmlEnding: args.stripHtmlEnding
				})
			)

			server.http((ctr) => {
				console.log(`${prefix} ${colors.fg.gray}${ctr.client.ip.usual()} ${colors.fg.green}HTTP ${ctr.url.method} ${colors.fg.cyan}${coloredPath(ctr.url.path)}`)
			})

			server.start()
				.then((port) => {
					console.log(`${prefix} ${colors.fg.green}Started on Port ${colors.fg.cyan}${port}`)
				})
				.catch((err: Error) => {
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
			const { default: inquirer } = await eval('import("inquirer")') as typeof import('inquirer')

			console.log(`${prefix} ${colors.fg.gray}Fetching Templates from GitHub...`)
			const templates: Template[] = []
			;(JSON.parse((await new Promise<Buffer>((resolve, reject) => {
				const chunks: Buffer[] = []
				https.get({
					path: '/repos/0x7d8/NPM_WEB-SERVER/contents/templates',
					host: 'api.github.com',
					port: 443,
					headers: {
						"User-Agent": `rjweb-server@cli ${version}`,
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
							"User-Agent": `rjweb-server@cli ${version}`,
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
							if (!fs.existsSync(pPath.join(process.cwd(), args.folder, file.path.replace(`templates/[${variant}] ${template}`, '')))) {
								await fs.promises.mkdir(pPath.join(process.cwd(), args.folder, file.path.replace(`templates/[${variant}] ${template}`, '')))
							}
						}

						await handleDirectory(file.url)
					}
				} else {
					const file = files
					if (file.name === 'yarn.lock') return

					console.log(`${prefix} ${colors.fg.green}Downloaded ${colors.fg.cyan}${path.join(args.folder, file.path.replace(`templates/[${variant}] ${template}`, ''))}`)
					await fs.promises.writeFile(path.join(process.cwd(), args.folder, file.path.replace(`templates/[${variant}] ${template}`, '')), Buffer.from(file.content!, 'base64').toString())
				}
			}

			await handleDirectory(templates.find((t) => t.name === template)!.variants.find((v) => v.name === variant)!.git.url)

			console.log('')
			console.log(`${prefix} ${colors.fg.green}Template Project Generated!`)
			console.log('')

			// Test for Package Managers
			let availablePackageManagers: PackageManager[] = []
			try {
				execSync('npm --version', {
					stdio: 'ignore'
				})

				availablePackageManagers.push('npm')
			} catch { }
			try {
				execSync('yarn --version', {
					stdio: 'ignore'
				})

				availablePackageManagers.push('yarn')
			} catch { }
			try {
				execSync('pnpm --version', {
					stdio: 'ignore'
				})

				availablePackageManagers.push('pnpm')
			} catch { }
			try {
				execSync('bun --version', {
					stdio: 'ignore'
				})

				availablePackageManagers.push('bun')
			} catch { }

			let continueWith: PackageManager = 'npm'
			await inquirer.prompt([
				{
					name: 'Continue with',
					type: 'list',
					prefix,
					choices: availablePackageManagers,
					askAnswered: true
				}
			]).then((answers) => {
				continueWith = answers['Continue with']
			})

			const spinner = new Spinner()
			const runInterval = () => {
				process.stdout.write(`\r${prefix} ${colors.fg.yellow}${spinner.get()} ${colors.fg.gray}Installing Dependencies with ${colors.fg.cyan}${continueWith}${colors.fg.gray}...`)
			}

			const interval = setInterval(runInterval, 175)
			runInterval()

			process.chdir(path.join(process.cwd(), args.folder))
			exec(`${continueWith} install`, () => {
				clearInterval(interval)
				process.stdout.write('\n')
				console.log(`${prefix} ${colors.fg.green}Installed Dependencies!${colors.reset}`)
			})
		})
	)
	.help()
	.argv