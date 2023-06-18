import { HttpResponse } from "@rjweb/uws"
import { LocalContext } from "../types/context"
import parseStatus from "./parseStatus"
import parseContent from "./parseContent"

/**
 * Write Important HTTP Meta like Status, Headers and Cookies
 * @since 8.3.0
*/ export default async function writeHTTPMeta(res: HttpResponse, ctx: LocalContext): Promise<() => void> {
	const readyHeaders: Record<string, Buffer> = {}
	const readyCookies: Record<string, string> = {}

	// Headers
	for (const header in ctx.response.headers) {
		if (!ctx.response.headers[header]) continue

		const parsed = await parseContent(ctx.response.headers[header])
		readyHeaders[header] = parsed.content
	}

	// Cookies
	for (const cookie in ctx.response.cookies) {
		if (!ctx.response.cookies[cookie] || !ctx.response.cookies[cookie].value) continue
		const infos = ctx.response.cookies[cookie]

		const parsed = await parseContent(infos.value)
		let cookieString = `${cookie}=${encodeURIComponent(parsed.content.toString())}`

		// Build Cookie String
		if (infos.domain) cookieString += `;Domain=${infos.domain}`
		if ('expires' in infos && infos.expires) cookieString += `;Expires=${infos.expires.toUTCString()}`
		if ('maxAge' in infos && infos.maxAge !== undefined) cookieString += `;Max-Age=${infos.maxAge}`
		if (infos.httpOnly) cookieString += `;HttpOnly`
		if (infos.path) cookieString += `;Path=${infos.path}`
		if (infos.sameSite) cookieString += `;SameSite=${infos.sameSite[0].toUpperCase() + infos.sameSite.slice(1)}`
		if (infos.secure) cookieString += `;Secure`

		readyCookies[cookie] = cookieString
	}

	return () => {
		if (!ctx.isAborted) res.writeStatus(parseStatus(ctx.response.status, ctx.response.statusMessage))

		for (const header in readyHeaders) {
			if (!ctx.isAborted) res.writeHeader(header, readyHeaders[header])
		}

		for (const cookie in readyCookies) {
      if (!ctx.isAborted) res.writeHeader('set-cookie', readyCookies[cookie])
    }
	}
}