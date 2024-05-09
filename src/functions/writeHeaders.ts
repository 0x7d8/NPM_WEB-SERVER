import { HttpContext } from "@/types/implementation/contexts/http"
import RequestContext from "@/types/internal/classes/RequestContext"
import toETag from "@/functions/toETag"
import Status from "@/enums/status"
import parseContent from "@/functions/parseContent"
import { isDate } from "util/types"
import toString from "@/functions/toString"

/**
 * Write HTTP Headers
 * @since 9.0.0
*/ export default async function writeHeaders(body: ArrayBuffer | null, context: RequestContext, rawContext: HttpContext): Promise<boolean> {
	if (context.global.options.performance.eTag && body) {
		const eTag = toETag(body, context.response.headers.toJSON(), context.response.cookies.toJSON(), context.response.status)

		if (eTag) {
			if (context.headers.get('if-none-match') === eTag) {
				rawContext.status(Status.NOT_MODIFIED, 'Not Modified').write(new ArrayBuffer(0))
				return false
			}

			context.response.headers.set('etag', eTag)
		}
	}

	for (const [ key, value ] of context.response.headers) {
		rawContext.header(key, value)
	}

	for (const [ cookie, data ] of context.response.cookies) {
		const parsed = await parseContent(data.value)
		let cookieString = `${cookie}=${encodeURIComponent(toString(parsed.content))}`

		if (data.domain) cookieString += `;Domain=${data.domain}`
		if (typeof data.expires === 'number') cookieString += `;Max-Age=${data.expires}`
		if (isDate(data.expires)) cookieString += `;Expires=${data.expires.toUTCString()}`
		if (data.httpOnly) cookieString +=';HttpOnly'
		if (data.path) cookieString += `;Path=${data.path}`
		if (data.sameSite) cookieString += `;SameSite=${data.sameSite[0].toUpperCase()}${data.sameSite.slice(1)}`
		if (data.secure) cookieString += ';Secure'

		rawContext.header('set-cookie', cookieString)
	}

	if (context.vary.size) rawContext.header('vary', Array.from(context.vary).join(', '))

	return true
}