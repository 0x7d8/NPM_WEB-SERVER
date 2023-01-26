#!/usr/bin/env node

import * as fs from "fs"
import * as path from "path"
import * as packageJSON from "package.json"
import { Options } from "./classes/serverOptions"
import webserver from "."

const webserverOptions: Partial<Options> = { dashboard: {} }
const args = process.argv.slice(2)
if (args.includes('-v') || args.includes('--version')) {
  console.log('[RJW] Version:')
  console.log(`v${packageJSON.version}`)
} else if (fs.existsSync(path.join(process.cwd(), args[0]))) {
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
    console.log(`[RJW] [${ctr.url.method}] ${ctr.url.href} FROM ${ctr.client.ip}`)
  }); webserver.start(webserverOptions as Options).then((res) => {
    console.log(`[RJW] Server started on port ${res.port}`)
  })
} else if (!fs.existsSync(path.join(process.cwd(), args[0]))) {
  console.log('[RJW] Error:')
  console.log(`Folder "${path.join(process.cwd(), args[0])}" couldnt be found`)
}

/** Last Resort */
else {
  console.log('[RJW] Help:')
  console.log('rjw-srv [folder] [options]')
  console.log('')
  console.log('Options:')
  console.log('--port=2023')
  console.log('--compress=false')
  console.log('--bind="0.0.0.0"')
  console.log('--remHTML=false')
  console.log('--addTypes=true')
  console.log('--dashboard=false')
}