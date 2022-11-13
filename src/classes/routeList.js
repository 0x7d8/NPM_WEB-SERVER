const { getAllFiles, getAllFilesFilter } = require('../misc/getAllFiles')
const types = require('../misc/types')

const path = require('node:path')
const fs = require('node:fs')

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
    * 
    * @typedef {Object} staticOptions { preload: Boolean, remHTML: Boolean }
    * @prop {Boolean} preload Whether to preload static files into Memory
    * @prop {Object} remHTML Whether to remove the .html ending from the static files
    * 
    * @param {staticOptions} options
    */
    static(path, folder, options) {
        const preload = options.preload || false
        const remHTML = options.remHTML || false

        for (const file of getAllFiles(folder)) {
            const fileName = file.replace(folder, '')
            let urlName = ''
            if (fileName.replace('/', '') === 'index.html' && remHTML) urlName = path.replace('//', '/')
            else if (fileName.replace('/', '').endsWith('.html') && remHTML) urlName = (path + fileName).replace('//', '/').replace('.html', '')
            else urlName = (path + fileName).replace('//', '/')

            this.urls['GET' + urlName] = {
                file,
                array: fileName.split('/'),
                type: 'STATIC'
            }; if (preload) this.urls['GET' + urlName].content = fs.readFileSync(file)
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