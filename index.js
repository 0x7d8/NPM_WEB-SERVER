const sleep = (milliseconds) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, milliseconds)
const { RouteList } = require('./utils/RouteList')
const http = require('node:http')
const url = require('node:url')

module.exports = {
    RouteList,
    types: {
        get: 'GET'
    },

    async start(options) {
        const urls = options.urls.list() || {}
        const bind = options.bind || '0.0.0.0'
        const port = options.port || 5002

        const server = http.createServer(async(req, res) => {
            const reqUrl = url.parse(req.url)

            // Create Answer Object
            const headers = new Map()
            Object.keys(req.headers).forEach(function(header) {
                headers.set(header, req.headers[header])
            }); headers.delete('cookie')
            const queries = new Map()
            for (const [query, value] of new URLSearchParams(reqUrl.search)) {
                queries.set(query, value)
            }; const cookies = new Map()
            if (!!req.headers.cookie) { req.headers.cookie.split(`;`).forEach(function(cookie) {
                let [ name, ...rest] = cookie.split(`=`)
                name = name?.trim()
                if (!name) return
                const value = rest.join(`=`).trim()
                if (!value) return
                cookies.set(name, decodeURIComponent(value))
            })}

            const ctr = {
                // Properties
                header: headers,
                cookie: cookies,
                query: queries,

                // Variables
                hostIp: req.socket.remoteAddress,
                hostPort: req.socket.remotePort,
                requestPath: reqUrl,

                // Functions
                print(msg) { res.write(msg) },
                status(code) { res.statusCode = code }
            }

            if (urls.hasOwnProperty(reqUrl.pathname) && urls[reqUrl.pathname].type === req.method) {
                await urls[reqUrl.pathname].code(ctr).catch((e) => {
                    res.write(e.message)
                    res.end()
                }); return res.end()
            } else {
                if (urls.hasOwnProperty('*')) {
                    await urls['*'].code(ctr).catch((e) => {
                        res.write(e.message)
                        res.end()
                    }); return res.end()
                }

                if (!options.hasOwnProperty('notfound')) {
                    let pageDisplay = ''
                    Object.keys(urls).forEach(function(url) {
                        pageDisplay = pageDisplay + `[-] [${urls[url].type}] ${url}`
                    })

                    res.statusCode = 404
                    res.write(`[!] COULDNT FIND ${reqUrl.pathname.toUpperCase()}\n[i] AVAILABLE PAGES:\n\n${pageDisplay}`)
                    res.end()
                } else {
                    await options.notfound(ctr).catch((e) => {
                        res.write(e.message)
                        res.end()
                    }); return res.end()
                }
            }
        })

        server.listen(port, bind)
        return { success: true, port, message: 'WEBSERVER STARTED' }
    }
}