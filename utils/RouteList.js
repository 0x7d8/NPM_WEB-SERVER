const types = [
    'GET'
]

class RouteList {
    constructor() {
        this.urls = []
    }

    set(type, url, code) {
        if (!types.includes(type)) throw TypeError('No Valid Request Type: ' + type)
        this.urls[url] = {
            hasParams: (url.match(/[\:]([A-Za-z0-9]+)/g) === null ? false : true),
            array: url.split('/'),
            type,
            code
        }
    }; list() {
        return this.urls
    }
}

exports.RouteList = RouteList