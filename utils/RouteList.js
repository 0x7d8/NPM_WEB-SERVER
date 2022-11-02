const types = [
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
    }; list() {
        return this.urls
    }
}

exports.RouteList = RouteList