const map = new Map()

export default interface ctr {
    header: typeof map
    cookie: typeof map
    param: typeof map
    query: typeof map

    hostPort: number
    hostIp: string
    reqBody?: string | { [key: string]: any }
    reqUrl: {
        protocol: string
        slashes: boolean
        auth: any | null
        host: string
        port: number | null
        hostname: string
        hash: string | null
        search: string | null
        query: string | null
        pathname: string
        path: string
        href: string
    }

    rawReq: any
    rawRes: any

    error: Error | null

    setHeader: (name: string, value: string) => null
    print: (msg: any) => null
    status: (code: number) => null
    printFile: (path: string) => null
}