class URLgen {
    constructor() {
        this.urls = {}
    }

    set(url, code) {
        this.urls[url] = code
    }

    list() {
        return this.urls
    }
}

exports.URLgen = URLgen