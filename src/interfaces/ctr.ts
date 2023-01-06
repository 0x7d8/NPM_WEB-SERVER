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

	setHeader: (name: string, value: string) => void
	print: (msg: any) => void
	status: (code: number) => void
	printFile: (path: string) => void
}