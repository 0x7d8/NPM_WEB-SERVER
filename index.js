const { getAllFiles, getAllFilesFilter } = require('./utils/getAllFiles.js')
const path = require('node:path')
const http = require('node:http')
const url = require('node:url')
const fs = require('node:fs')

const types = [
    'STATIC',
    'POST',
    'GET'
]

module.exports = {
    RouteList: class RouteList {
        constructor() {
            this.urls = []
        }
    
        set(type, url, code) {
            if (!types.includes(type)) throw TypeError(`No Valid Request Type: ${type}\nPossible Values: ${types.toString()}`)
            this.urls[url] = {
                array: url.split('/'),
                type,
                code
            }
        }; static(path, folder) {
            const files = getAllFiles(folder)
    
            for (const file of files) {
                const fileName = file.replace(folder, '')
                let urlName = ''
                if (fileName.replace('/', '') === 'index.html') {
                    urlName = (path).replace('//', '/')
                } else if (fileName.replace('/', '').endsWith('.html')) {
                    urlName = (path + fileName).replace('//', '/').replace('.html', '')
                } else {
                    urlName = (path + fileName).replace('//', '/')
                }
    
                this.urls[urlName] = {
                    array: fileName.split('/'),
                    type: 'STATIC',
                    content: fs.readFileSync(file, 'utf8')
                }
            }
        }; load(folder) {
            const files = getAllFilesFilter(folder, '.js')
    
            for (const file of files) {
                const route = require(path.resolve(file))
    
                if (
                    !route.hasOwnProperty('path') ||
                    !route.hasOwnProperty('type') ||
                    !route.hasOwnProperty('code')
                ) continue
                if (!types.includes(route.type)) throw TypeError(`No Valid Request Type: ${route.type}\nPossible Values: ${types.toString()}`)
    
                this.urls[route.path] = {
                    array: route.path.split('/'),
                    type: route.type,
                    code: route.code
                }
            }
        }
        
        list() {
            return this.urls
        }
    },
    types: {
        post: 'POST',
        get: 'GET'
    },

    async start(options) {
        const pages = options.pages || {}
        const events = options.events || {}
        const urls = options.urls.list() || []
        const bind = options.bind || '0.0.0.0'
        const cors = options.cors || false
        const port = options.port || 5002

        const server = http.createServer(async(req, res) => {
            let reqBody = ''

            req.on('data', (data) => {
                reqBody += data
            }).on('end', async() => {
                const reqUrl = url.parse(req.url)
                let executeUrl = ''

                // Cors Headers
                if (cors) {
                    res.setHeader('Access-Control-Allow-Origin', '*')
	                res.setHeader('Access-Control-Request-Method', '*')
	                res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET')
	                res.setHeader('Access-Control-Allow-Headers', '*')
                }

                // Check if URL exists
                let params = new Map()
                let exists, isStatic = false
                const actualUrl = reqUrl.pathname.split('/')
                if (actualUrl[actualUrl.length - 1] === '') actualUrl.pop()
                for (const elementName in urls) {
                    if (elementName in urls && elementName === reqUrl.pathname && urls[elementName].type === req.method) {
                        executeUrl = reqUrl.pathname
                        isStatic = false
                        exists = true

                        break
                    }; if (elementName in urls && elementName === reqUrl.pathname && urls[elementName].type === 'STATIC') {
                        executeUrl = reqUrl.pathname
                        isStatic = true
                        exists = true

                        break
                    }

                    const element = urls[elementName]
                    if (element.type !== req.method) continue
                    if (element.array.length !== actualUrl.length) continue
                    if (exists && element.array.join('/') !== executeUrl) break

                    let urlCount = 0
                    for (const subUrl of element.array) {
                        const urlParam = element.array[urlCount]
                        const reqParam = actualUrl[urlCount]
                        urlCount++

                        if (!urlParam.startsWith(':') && reqParam !== urlParam) break
                        if (urlParam === reqParam) {
                            continue
                        } else if (urlParam.startsWith(':')) {
                            params.set(urlParam.replace(':', ''), decodeURIComponent(reqParam))
                            executeUrl = element.array.join('/')
                            exists = true

                            continue
                        }

                        continue
                    }

                    continue
                }

                // Create Answer Object
                const headers = new Map()
                Object.keys(req.headers).forEach(function(header) {
                    headers.set(header, req.headers[header])
                }); headers.delete('cookie')
                const queries = new Map()
                for (const [query, value] of new URLSearchParams(reqUrl.search)) {
                    queries.set(query, value)
                }; const cookies = new Map()
                if (!!req.headers.cookie) { req.headers.cookie.split(';').forEach(function(cookie) {
                    let [ name, ...rest ] = cookie.split('=')
                    name = name?.trim()
                    if (!name) return
                    const value = rest.join('=').trim()
                    if (!value) return
                    cookies.set(name, decodeURIComponent(value))
                })}

                let ctr = {
                    // Properties
                    header: headers,
                    cookie: cookies,
                    param: params,
                    query: queries,

                    // Variables
                    hostIp: req.socket.remoteAddress,
                    hostPort: req.socket.remotePort,
                    reqUrl,
                    reqBody,

                    // Raw Values
                    rawReq: req,
                    rawRes: res,

                    // Functions
                    print(msg) {
                        if (typeof msg === 'object') {
                            res.writeHead(200, { 'Content-Type': 'application/json' })
                            res.write(JSON.stringify(msg))
                        } else {
                            res.write(msg)
                        }
                    },
                    status(code) { res.statusCode = code }
                }

                // Execute Custom Run Function
                let errorStop = false
                if ('request' in events) {
                    await events.request(ctr).catch((e) => {
                        if ('reqError' in pages) {
                            ctr.error = e
                            options.pages.reqError(ctr).catch((e) => {
                                errorStop = true
                                console.log(e)
                                res.statusCode = 500
                                return res.end()
                            }); errorStop = true
                            return res.end()
                        } else {
                            errorStop = true
                            console.log(e)
                            res.statusCode = 500
                            return res.end()
                        }
                    })
                }; if (errorStop) return

                // Execute Page
                if (exists) {
                    res.writeHead(200)

                    if (!isStatic) {
                        await urls[executeUrl].code(ctr).catch((e) => {
                            if ('reqError' in pages) {
                                ctr.error = e
                                options.pages.reqError(ctr).catch((e) => {
                                    console.log(e)
                                    res.statusCode = 500
                                    res.write(e)
                                    res.end()
                                }); return res.end()
                            } else {
                                console.log(e)
                                res.statusCode = 500
                                res.write(e)
                                res.end()
                            }
                        }); return res.end()
                    } else {
                        res.write(urls[executeUrl].content)
                        return res.end()
                    }
                } else {

                    if ('notFound' in pages) {
                        await options.pages.notFound(ctr).catch((e) => {
                            if ('reqError' in pages) {
                                ctr.error = e
                                options.pages.reqError(ctr).catch((e) => {
                                    console.log(e)
                                    res.statusCode = 500
                                    res.write(e)
                                    res.end()
                                }); return res.end()
                            } else {
                                console.log(e)
                                res.statusCode = 500
                                res.write(e)
                                res.end()
                            }
                        }); return res.end()
                    } else {
                        let pageDisplay = ''
                        Object.keys(urls).forEach(function(url) {
                            const type = (urls[url].type === 'STATIC' ? 'GET' : urls[url].type)

                            pageDisplay = pageDisplay + `[-] [${type}] ${url}\n`
                        })

                        res.statusCode = 404
                        res.writeHead(404)
                        res.write(`[!] COULDNT FIND ${reqUrl.pathname.toUpperCase()}\n[i] AVAILABLE PAGES:\n\n${pageDisplay}`)
                        res.end()
                    }
                }
            })
        })
            

        server.listen(port, bind)
        return { success: true, port, message: 'WEBSERVER STARTED' }
    }
}