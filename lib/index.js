"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const routeList_1 = __importDefault(require("./classes/routeList"));
const types_1 = __importDefault(require("./interfaces/types"));
const types_2 = __importDefault(require("./misc/types"));
const path = __importStar(require("path"));
const http = __importStar(require("http"));
const url = __importStar(require("url"));
const fs = __importStar(require("fs"));
module.exports = {
    // Misc
    routeList: routeList_1.default,
    types: types_1.default,
    // Start
    async start(
    /** Required Options */ options) {
        const pages = options?.pages || {};
        const events = options?.events || {};
        const urls = options?.urls.list() || [];
        const proxy = options?.proxy || false;
        const rateLimits = options?.rateLimits || { enabled: false, list: [] };
        const bind = options?.bind || '0.0.0.0';
        const cors = options?.cors || false;
        const port = options?.port || 5002;
        const body = options?.body || 20;
        const server = http.createServer(async (req, res) => {
            let reqBody = '';
            if (!!req.headers['content-length']) {
                const bodySize = parseInt(req.headers['content-length']);
                if (bodySize >= (body * 1e6)) {
                    res.statusCode = 413;
                    res.write('Payload Too Large');
                    return res.end();
                }
            }
            req.on('data', (data) => {
                reqBody += data;
            }).on('end', async () => {
                let reqUrl = url.parse(req.url);
                if (reqUrl.path.endsWith('/'))
                    reqUrl.path = reqUrl.path.slice(0, -1);
                let executeUrl = '';
                // Parse Request Body
                try {
                    reqBody = JSON.parse(reqBody);
                }
                catch (e) { }
                // Cors Stuff
                if (cors) {
                    res.setHeader('Access-Control-Allow-Headers', '*');
                    res.setHeader('Access-Control-Allow-Origin', '*');
                    res.setHeader('Access-Control-Request-Method', '*');
                    res.setHeader('Access-Control-Allow-Methods', types_2.default.join(','));
                    if (req.method === 'OPTIONS')
                        return res.end('');
                }
                // Check if URL exists
                let params = new Map();
                let exists, isStatic = false;
                const actualUrl = reqUrl.pathname.split('/');
                if (actualUrl[actualUrl.length - 1] === '')
                    actualUrl.pop();
                for (const elementName in urls) {
                    if (elementName in urls && elementName.replace(req.method, '') === reqUrl.pathname && urls[elementName].type === req.method) {
                        executeUrl = req.method + reqUrl.pathname;
                        isStatic = false;
                        exists = true;
                        break;
                    }
                    ;
                    if (elementName in urls && elementName.replace(req.method, '') === reqUrl.pathname && urls[elementName].type === 'STATIC') {
                        executeUrl = req.method + reqUrl.pathname;
                        isStatic = true;
                        exists = true;
                        break;
                    }
                    const element = urls[elementName];
                    if (element.type !== req.method)
                        continue;
                    if (element.array.length !== actualUrl.length)
                        continue;
                    if (exists && element.array.join('/') !== executeUrl)
                        break;
                    let urlCount = 0;
                    for (const subUrl of element.array) {
                        const urlParam = element.array[urlCount];
                        const reqParam = actualUrl[urlCount];
                        urlCount++;
                        if (!urlParam.startsWith(':') && reqParam !== urlParam)
                            break;
                        if (urlParam === reqParam) {
                            continue;
                        }
                        else if (urlParam.startsWith(':')) {
                            params.set(urlParam.replace(':', ''), decodeURIComponent(reqParam));
                            executeUrl = req.method + element.array.join('/');
                            exists = true;
                            continue;
                        }
                        continue;
                    }
                    continue;
                }
                // Get Correct Host IP
                let hostIp;
                if (proxy && req.headers['x-forwarded-for'])
                    hostIp = req.headers['x-forwarded-for'];
                else
                    hostIp = req.socket.remoteAddress;
                // Create Answer Object
                const headers = new Map();
                Object.keys(req.headers).forEach((header) => {
                    headers.set(header, req.headers[header]);
                });
                headers.delete('cookie');
                const queries = new Map();
                for (const [query, value] of new URLSearchParams(reqUrl.search)) {
                    queries.set(query, value);
                }
                ;
                const cookies = new Map();
                if (!!req.headers.cookie) {
                    req.headers.cookie.split(';').forEach((cookie) => {
                        let [name, ...rest] = cookie.split('=');
                        name = name?.trim();
                        if (!name)
                            return;
                        const value = rest.join('=').trim();
                        if (!value)
                            return;
                        cookies.set(name, decodeURIComponent(value));
                    });
                }
                res.setHeader('X-Powered-By', 'rjweb-server');
                let ctr = {
                    // Properties
                    header: headers,
                    cookie: cookies,
                    param: params,
                    query: queries,
                    // Variables
                    hostPort: req.socket.remotePort,
                    hostIp,
                    reqBody,
                    reqUrl,
                    // Raw Values
                    rawReq: req,
                    rawRes: res,
                    // Functions
                    setHeader(name, value) {
                        return res.setHeader(name, value);
                    }, print(msg) {
                        switch (typeof msg) {
                            case 'object':
                                res.setHeader('Content-Type', 'application/json');
                                res.write(JSON.stringify(msg, undefined, 1));
                                break;
                            case 'bigint':
                            case 'number':
                            case 'boolean':
                                res.write(msg.toString());
                                break;
                            case 'function':
                                this.print(msg());
                                break;
                            case 'undefined':
                                res.write('');
                                break;
                            default:
                                try {
                                    res.write(msg);
                                }
                                catch (e) {
                                    if ('reqError' in pages) {
                                        ctr.error = e;
                                        Promise.resolve(options.pages.reqError(ctr)).catch((e) => {
                                            console.log(e);
                                            res.statusCode = 500;
                                            res.write(e);
                                            res.end();
                                        }).then(() => res.end());
                                        errorStop = true;
                                    }
                                    else {
                                        errorStop = true;
                                        console.log(e);
                                        res.statusCode = 500;
                                        return res.end();
                                    }
                                }
                        }
                    }, status(code) { res.statusCode = code; },
                    printFile(file) {
                        const content = fs.readFileSync(file);
                        return res.write(content, 'binary');
                    }
                };
                // Execute Custom Run Function
                let errorStop = false;
                if ('request' in events) {
                    await events.request(ctr).catch((e) => {
                        if ('reqError' in pages) {
                            ctr.error = e;
                            Promise.resolve(options.pages.reqError(ctr)).catch((e) => {
                                console.log(e);
                                res.statusCode = 500;
                                res.write(e);
                                res.end();
                            }).then(() => res.end());
                            errorStop = true;
                        }
                        else {
                            errorStop = true;
                            console.log(e);
                            res.statusCode = 500;
                            return res.end();
                        }
                    });
                }
                ;
                if (errorStop)
                    return;
                // Rate Limiting
                if (rateLimits.enabled) {
                    for (const rule of rateLimits.list) {
                        if (reqUrl.path.startsWith(rule.path)) {
                            res.setHeader('X-RateLimit-Limit', rule.times);
                            res.setHeader('X-RateLimit-Remaining', rule.times - (await rateLimits.functions.get(hostIp + rule.path) ?? 0));
                            res.setHeader('X-RateLimit-Reset-Every', rule.timeout);
                            await rateLimits.functions.set(hostIp + rule.path, (await rateLimits.functions.get(hostIp + rule.path) ?? 0) + 1);
                            setTimeout(async () => { await rateLimits.functions.set(hostIp + rule.path, (await rateLimits.functions.get(hostIp + rule.path) ?? 0) - 1); }, rule.timeout);
                            if (await rateLimits.functions.get(hostIp + rule.path) > rule.times) {
                                res.statusCode = 429;
                                ctr.print(rateLimits.message ?? 'Rate Limited');
                                return res.end();
                            }
                        }
                    }
                }
                // Execute Page
                if (exists) {
                    if (!isStatic) {
                        Promise.resolve(urls[executeUrl].code(ctr)).catch((e) => {
                            if ('reqError' in pages) {
                                ctr.error = e;
                                Promise.resolve(options.pages.reqError(ctr)).catch((e) => {
                                    console.log(e);
                                    res.statusCode = 500;
                                    res.write(e);
                                    res.end();
                                }).then(() => res.end());
                            }
                            else {
                                console.log(e);
                                res.statusCode = 500;
                                res.write(e);
                                res.end();
                            }
                        }).then(() => res.end());
                    }
                    else {
                        // Add Content Types
                        if (urls[executeUrl].addTypes) {
                            if (urls[executeUrl].path.endsWith('.pdf'))
                                ctr.setHeader('Content-Type', 'application/pdf');
                            if (urls[executeUrl].path.endsWith('.js'))
                                ctr.setHeader('Content-Type', 'text/javascript');
                            if (urls[executeUrl].path.endsWith('.html'))
                                ctr.setHeader('Content-Type', 'text/html');
                            if (urls[executeUrl].path.endsWith('.css'))
                                ctr.setHeader('Content-Type', 'text/css');
                            if (urls[executeUrl].path.endsWith('.csv'))
                                ctr.setHeader('Content-Type', 'text/csv');
                            if (urls[executeUrl].path.endsWith('.mpeg'))
                                ctr.setHeader('Content-Type', 'video/mpeg');
                            if (urls[executeUrl].path.endsWith('.mp4'))
                                ctr.setHeader('Content-Type', 'video/mp4');
                            if (urls[executeUrl].path.endsWith('.webm'))
                                ctr.setHeader('Content-Type', 'video/webm');
                            if (urls[executeUrl].path.endsWith('.bmp'))
                                ctr.setHeader('Content-Type', 'image/bmp');
                        }
                        // Read Content
                        if (!('content' in urls[executeUrl])) {
                            let content;
                            const filePath = path.resolve(urls[executeUrl].file);
                            try {
                                content = fs.readFileSync(filePath);
                            }
                            catch (e) {
                                console.log(e);
                                return res.end();
                            }
                            res.write(content, 'binary');
                            return res.end();
                        }
                        res.write(urls[executeUrl].content, 'binary');
                        return res.end();
                    }
                }
                else {
                    if ('notFound' in pages) {
                        Promise.resolve(options.pages.notFound(ctr)).catch((e) => {
                            if ('reqError' in pages) {
                                ctr.error = e;
                                options.pages.reqError(ctr).catch((e) => {
                                    console.log(e);
                                    res.statusCode = 500;
                                    res.write(e);
                                    res.end();
                                }).then(() => res.end());
                            }
                            else {
                                console.log(e);
                                res.statusCode = 500;
                                res.write(e);
                                res.end();
                            }
                        }).then(() => res.end());
                    }
                    else {
                        let pageDisplay = '';
                        for (const rawUrl in urls) {
                            const url = urls[rawUrl];
                            const type = (url.type === 'STATIC' ? 'GET' : url.type);
                            pageDisplay += `[-] [${type}] ${url.path}\n`;
                        }
                        res.statusCode = 404;
                        res.write(`[!] COULDNT FIND ${reqUrl.pathname.toUpperCase()}\n[i] AVAILABLE PAGES:\n\n${pageDisplay}`);
                        res.end();
                    }
                }
            });
        });
        server.on('upgrade', (req, socket, head) => {
            socket.write('HTTP/1.1 101 Web Socket Protocol Handshake\r\n' +
                'Upgrade: WebSocket\r\n' +
                'Connection: Upgrade\r\n' +
                '\r\n');
            socket.pipe(socket);
        });
        server.listen(port, bind);
        return { success: true, port, message: 'WEBSERVER STARTED' };
    }
};
//# sourceMappingURL=index.js.map