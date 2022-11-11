const { getAllFiles, getAllFilesFilter } = require('./utils/getAllFiles.js')
const path = require('node:path')
const http = require('node:http')
const url = require('node:url')
const fs = require('node:fs')

const types = [
    'DELETE',
    'PATCH',
    'STATIC',
    'POST',
    'PUT',
    'GET'
]

module.exports = {
    RouteList: class RouteList {
        constructor() {
            this.urls = []
        }
    
        /**
        * Set URL
        *
        * @param {String} type Request Type ( GET, POST, etc... )
        * @param {String} url Url on which the Code will run
        * @param {Function} code Your Async Code
        */
        set(type, url, code) {
            if (!types.includes(type)) throw TypeError(`No Valid Request Type: ${type}\nPossible Values: ${types.toString()}`)
            this.urls[url] = {
                array: url.split('/'),
                type,
                code
            }
        }
        
        /**
        * Serve Static Files
        *
        * @param {String} path Path on which all files will be served under
        * @param {String} folder Path to the Folder with the static files
        * @param {Boolean} preload If Enabled will load every file into memory
        */
        static(path, folder, preload) {
            preload = preload || false
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

                this.urls[urlName]= {
                    file,
                    array: fileName.split('/'),
                    type: 'STATIC'
                }; if (preload) this.urls[urlName].content = fs.readFileSync(file)
            }
        }
        
        /**
        * Load Function Files
        *
        * @param {String} folder Path to the Folder with the function files
        */
        load(folder) {
            const files = getAllFilesFilter(folder, '.js')
    
            for (const file of files) {
                const route = require(path.resolve(file))
    
                if (
                    !('path' in route) ||
                    !('type' in route) ||
                    !('code' in route)
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
        delete: 'DELETE',
        patch: 'PATCH',
        post: 'POST',
        put: 'PUT',
        get: 'GET'
    },

    /**
    * Start Server
    *
    * @typedef {Object} startOptions { pages: Object, events: Object, urls: RouteList, bind: String, cors: Boolean, port: Number }
    * @prop {Object} pages List of Custom Pages ( 404 / 500 )
    * @prop {Object} events List of Custom Events ( On Request, etc... )
    * @prop {Array} urls List of Webserver Urls ( Added by RouteList )
    * @prop {String} bind IP the Server should be bound to ( default 0.0.0.0 )
    * @prop {Number} port The Port the Server should listen on ( default 5002 )
    * @prop {Number} body The Maximum Body Size in MB ( default 5 )
    * 
    * @param {startOptions} options
    */
    async start(options) {
        const pages = options.pages || {}
        const events = options.events || {}
        const urls = options.urls.list() || []
        const bind = options.bind || '0.0.0.0'
        const cors = options.cors || false
        const port = options.port || 5002
        const body = options.body || 20

        const server = http.createServer(async(req, res) => {
            let reqBody = ''

            server.on('upgrade', (req, socket, head) => {
                socket.write('HTTP/1.1 101 Web Socket Protocol Handshake\r\n' +
                             'Upgrade: WebSocket\r\n' +
                             'Connection: Upgrade\r\n' +
                             '\r\n')
    
                socket.pipe(socket)
            })

            if (!!req.headers['content-length']) {
                const bodySize = parseInt(req.headers['content-length'])

                if (bodySize >= (body * 1000000)) {
                    res.statusCode = 413
                    res.write('Payload Too Large')
                    return res.end()
                }
            }

            req.on('data', (data) => {
                reqBody += data
            }).on('end', async() => {
                const reqUrl = url.parse(req.url)
                let executeUrl = ''

                // Parse Request Body
                try { reqBody = JSON.parse(reqBody)
                } catch(e) { }

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
                Object.keys(req.headers).forEach((header) => {
                    headers.set(header, req.headers[header])
                }); headers.delete('cookie')
                const queries = new Map()
                for (const [query, value] of new URLSearchParams(reqUrl.search)) {
                    queries.set(query, value)
                }; const cookies = new Map()
                if (!!req.headers.cookie) { req.headers.cookie.split(';').forEach((cookie) => {
                    let [ name, ...rest ] = cookie.split('=')
                    name = name?.trim()
                    if (!name) return
                    const value = rest.join('=').trim()
                    if (!value) return
                    cookies.set(name, decodeURIComponent(value))
                })}

                res.setHeader('X-Powered-By', 'rjweb-server')
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
                    setHeader: res.setHeader,
                    print(msg) {
                        switch (typeof msg) {
                            case 'object':
                                res.setHeader('Content-Type', 'application/json')
                                res.write(JSON.stringify(msg))
                                break

                            case 'bigint':
                            case 'number':
                            case 'boolean':
                                res.write(msg.toString())
                                break

                            case 'function':
                                this.print(msg())
                                break

                            case 'undefined':
                                res.write('')
                                break

                            default:
                                try {
                                    res.write(msg)
                                } catch(e) {
                                    if ('reqError' in pages) {
                                        ctr.error = e
                                        Promise.resolve(options.pages.reqError(ctr)).catch((e) => {
                                            console.log(e)
                                            res.statusCode = 500
                                            res.write(e)
                                            res.end()
                                        }).then(() => res.end())
                                        errorStop = true
                                    } else {
                                        errorStop = true
                                        console.log(e)
                                        res.statusCode = 500
                                        return res.end()
                                    }
                                }
                        }
                    }, status(code) { res.statusCode = code },
                    printFile(file) {
                        const content = fs.readFileSync(file)
                        res.write(content, 'binary')
                    }
                }

                // Execute Custom Run Function
                let errorStop = false
                if ('request' in events) {
                    await events.request(ctr).catch((e) => {
                        if ('reqError' in pages) {
                            ctr.error = e
                            Promise.resolve(options.pages.reqError(ctr)).catch((e) => {
                                console.log(e)
                                res.statusCode = 500
                                res.write(e)
                                res.end()
                            }).then(() => res.end())
                            errorStop = true
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
                    if (!isStatic) {
                        Promise.resolve(urls[executeUrl].code(ctr)).catch((e) => {
                            if ('reqError' in pages) {
                                ctr.error = e
                                Promise.resolve(options.pages.reqError(ctr)).catch((e) => {
                                    console.log(e)
                                    res.statusCode = 500
                                    res.write(e)
                                    res.end()
                                }).then(() => res.end())
                            } else {
                                console.log(e)
                                res.statusCode = 500
                                res.write(e)
                                res.end()
                            }
                        }).then(() => res.end())
                    } else {
                        if (!('content' in urls[executeUrl])) {
                            let content
                            const filePath = path.resolve(urls[executeUrl].file)
                            try { content = fs.readFileSync(filePath) }
                            catch(e) { console.log(e); return res.end() }

                            res.write(content, 'binary')
                            return res.end()
                        }

                        res.write(urls[executeUrl].content, 'binary')
                        return res.end()
                    }
                } else {
                    if ('notFound' in pages) {
                        Promise.resolve(options.pages.notFound(ctr)).catch((e) => {
                            if ('reqError' in pages) {
                                ctr.error = e
                                options.pages.reqError(ctr).catch((e) => {
                                    console.log(e)
                                    res.statusCode = 500
                                    res.write(e)
                                    res.end()
                                }).then(() => res.end())
                            } else {
                                console.log(e)
                                res.statusCode = 500
                                res.write(e)
                                res.end()
                            }
                        }).then(() => res.end())
                    } else {
                        let pageDisplay = ''
                        Object.keys(urls).forEach((url) => {
                            const type = (urls[url].type === 'STATIC' ? 'GET' : urls[url].type)

                            pageDisplay = pageDisplay + `[-] [${type}] ${url}\n`
                        })

                        res.statusCode = 404
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