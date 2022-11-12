const { getAllFiles, getAllFilesFilter } = require('../misc/getAllFiles')
const types = require('../misc/types')

const path = require('node:path')

module.exports = class routeList {
    constructor() {
        this.urls = []
    }

    /**
    * Set URL
    *
    * @param {String} type Request Type ( GET, POST, etc... )
    * @param {String} url Url on which the Code will run
    * @param {Function} code Your Asyncronous Code to run
    */
    set(type, url, code) {
        if (!types.includes(type)) throw TypeError(`No Valid Request Type: ${type}\nPossible Values: ${types.join(', ')}`)
        this.urls[type + url] = {
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

            this.urls['GET' + urlName]= {
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

            this.urls[route.type + route.path] = {
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