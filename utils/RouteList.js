class RouteList {
    constructor() {
        this.urls = {}
    }

    set(type, url, code) {
        this.urls[url] = { type, code }
    }; list() {
        return this.urls
    }
}

exports.RouteList = RouteList