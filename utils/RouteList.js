const { getAllFiles, getAllFilesFilter } = require('./getAllFiles.js')
const fs = require('node:fs')

const types = [
    'STATIC',
    'POST',
    'GET'
]

class RouteList {
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
            const route = require('.' + file)

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
}

exports.RouteList = RouteList