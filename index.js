const { RouteList } = require('./utils/RouteList')
const http = require('node:http')
const url = require('node:url')

module.exports = {
    RouteList,
    types: {
        post: 'POST',
        get: 'GET'
    },

    async start(options) {
        const pages = options.pages || {}
        const urls = options.urls.list() || []
        const bind = options.bind || '0.0.0.0'
        const cors = options.cors || false
        const port = options.port || 5002

        const server = http.createServer(async(req, res) => {
            const reqUrl = url.parse(req.url)
            let executeUrl = ''

            // Cors Headers
            let corsHeaders = {}
            if (cors) {
                corsHeaders = {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'OPTIONS, POST, GET',
                    'Access-Control-Max-Age': 2592000
                }
            }

            // Check if URL exists
            let params = new Map()
            let exists = false
            const actualUrl = reqUrl.pathname.split('/')
            if (actualUrl[actualUrl.length - 1] === '') actualUrl.pop()
            for (const elementName in urls) {
                if (elementName in urls && elementName === reqUrl.pathname && urls[elementName].type === req.method) {
                    executeUrl = reqUrl.pathname
                    exists = true

                    break
                }
                
                const element = urls[elementName]
                if (element.type !== req.method) continue
                if (element.array.length !== actualUrl.length) continue

                let urlCount = 0
                for (const subUrl of element.array) {
                    const urlParam = element.array[urlCount]
                    const reqParam = actualUrl[urlCount]
                    urlCount++

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

            // Get POST Body
            /*res.write('')
            let reqBody = '';

            res.on('data', (data) => {
                reqBody += data.toString()
            })

            await new Promise((resolve) => {
                res.once('end', resolve)
            })*/

            let ctr = {
                // Properties
                header: headers,
                cookie: cookies,
                param: params,
                query: queries,

                // Variables
                hostIp: req.socket.remoteAddress,
                hostPort: req.socket.remotePort,
                requestPath: reqUrl,

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

            if (exists) {
                res.writeHead(200, corsHeaders)

                await urls[executeUrl].code(ctr).catch((e) => {
                    if (!'reqError' in pages) {
                        res.statusCode = 500
                        res.write(e.message)
                        res.end()
                    } else {
                        ctr.error = e.message
                        options.pages.reqError(ctr).catch((e) => {
                            res.statusCode = 500
                            res.write('error errored')
                            res.end()
                        }); return res.end()
                    }
                }); return res.end()
            } else {

                if (!'notFound' in pages) {
                    let pageDisplay = ''
                    Object.keys(urls).forEach(function(url) {
                        pageDisplay = pageDisplay + `[-] [${urls[url].type}] ${url}\n`
                    })

                    res.statusCode = 404
                    res.writeHead(404, corsHeaders)
                    res.write(`[!] COULDNT FIND ${reqUrl.pathname.toUpperCase()}\n[i] AVAILABLE PAGES:\n\n${pageDisplay}`)
                    res.end()
                } else {
                    await options.pages.notFound(ctr).catch((e) => {
                        if (!'reqError' in pages) {
                            res.statusCode = 500
                            res.write(e.message)
                            res.end()
                        } else {
                            ctr.error = e.message
                            options.pages.reqError(ctr).catch((e) => {
                                res.statusCode = 500
                                res.write('error errored')
                                res.end()
                            }); return res.end()
                        }
                    }); return res.end()
                }
            }
        })

        server.listen(port, bind)
        return { success: true, port, message: 'WEBSERVER STARTED' }
    }
}