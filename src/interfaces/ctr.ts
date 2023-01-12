import { UrlWithStringQuery } from "url"
const map = new Map()

export default interface ctr {
	header: typeof map
	cookie: typeof map
	param: typeof map
	query: typeof map

	hostPort: number
	hostIp: string
	reqBody?: string | { [key: string]: any }
	reqUrl: UrlWithStringQuery

	rawReq: any
	rawRes: any

	error?: Error

	setHeader: (name: string, value: string) => ctr
	print: (msg: any) => ctr
	status: (code: number) => ctr
	printFile: (path: string) => ctr
}