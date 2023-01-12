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
Object.defineProperty(exports, "__esModule", { value: true });
const getAllFiles_1 = require("../misc/getAllFiles");
const types_1 = __importDefault(require("../misc/types"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
class routeList {
    /** List of Routes */
    constructor(
    /**
     * Routes to Import
     * @default []
     */ routes) {
        routes = routes ?? [];
        this.urls = routes;
    }
    /** Set A Route Manually */
    set(
    /** The Request Type */ type, 
    /** The Path on which this will be available */ path, 
    /** The Async Code to run on a Request */ code) {
        if (!types_1.default.includes(type))
            throw TypeError(`No Valid Request Type: ${type}\nPossible Values: ${types_1.default.join(', ')}`);
        this.urls[type + path] = {
            array: path.split('/'),
            addTypes: false,
            path,
            type,
            code
        };
    }
    /** Serve Static Files */
    static(
    /** The Path to serve the Files on */ path, 
    /** The Location of the Folder to load from */ folder, 
    /** Additional Options */ options) {
        const preload = options?.preload ?? false;
        const remHTML = options?.remHTML ?? false;
        const addTypes = options?.addTypes ?? true;
        for (const file of (0, getAllFiles_1.getAllFiles)(folder)) {
            const fileName = file.replace(folder, '');
            let urlName = '';
            if (fileName.replace('/', '') === 'index.html' && remHTML)
                urlName = path.replace('//', '/');
            else if (fileName.replace('/', '').endsWith('.html') && remHTML)
                urlName = (path + fileName).replace('//', '/').replace('.html', '');
            else
                urlName = (path + fileName).replace('//', '/');
            this.urls['GET' + urlName] = {
                file,
                array: urlName.split('/'),
                addTypes,
                path: urlName,
                type: 'STATIC'
            };
            if (preload)
                this.urls['GET' + urlName].content = fs.readFileSync(file);
        }
    }
    /** Load External Function Files */
    load(
    /** The Location of the Folder to load from */ folder) {
        const files = (0, getAllFiles_1.getAllFilesFilter)(folder, '.js');
        for (const file of files) {
            const route = require(path.resolve(file));
            if (!('path' in route) ||
                !('type' in route) ||
                !('code' in route))
                continue;
            if (!types_1.default.includes(route.type))
                throw TypeError(`No Valid Request Type: ${route.type}\nPossible Values: ${types_1.default.toString()}`);
            this.urls[route.type + route.path] = {
                array: route.path.split('/'),
                addTypes: false,
                path: route.path,
                type: route.type,
                code: route.code
            };
        }
    }
    /** Internal Function to access all URLs as Array */
    list() {
        return this.urls;
    }
}
exports.default = routeList;
//# sourceMappingURL=routeList.js.map