const { URLgen } = require('./utils/URLgen')
const http = require('node:http')
const url = require('node:url')

module.exports = {
    URLgen,

    async start(port, urls) {
        urls = urls.list()

        const server = http.createServer(async(req, res) => {
            const reqUrl = url.parse(req.url)

            if (urls.hasOwnProperty(reqUrl.pathname)) {
                await urls[reqUrl.pathname](req, res).catch((e) => {
                    res.write(e.message)
                    res.end()
                }); return res.end()
            } else {
                if (urls.hasOwnProperty('*')) {
                    await urls['*'](req, res).catch((e) => {
                        res.write(e.message)
                        res.end()
                    }); return res.end()
                }

                let pageDisplay = ''
                Object.keys(urls).forEach(function(url) {
                    pageDisplay = pageDisplay + `[-] ${url}`
                })

                res.write(`[!] COULDNT FIND ${reqUrl.pathname.toUpperCase()}\n[i] AVAILABLE PAGES:\n\n${pageDisplay}`)
                res.end()
            }
        })

        server.listen(port)
        return { success: true, message: 'WEBSERVER STARTED' }
    }
}