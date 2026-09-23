import type { HttpContext } from "@/types/implementation/contexts/http"
import type RequestContext from "@/types/internal/classes/RequestContext"
import toETag from "@/functions/toETag"
import Status from "@/enums/status"
import { parseContentSync } from "@/functions/parseContent"
import { isDate } from "util/types"
import toString from "@/functions/toString"
import { STATUS_CODES } from "http"

const noCookies: Record<string, never> = {}

function returnFalse(): false {
	return false
}

async function writeCookies(context: RequestContext, rawContext: HttpContext): Promise<void> {
	for (const [ cookie, data ] of context.response.cookies) {
		const parsed = await parseContentSync(data.value)
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
}

function writeRest(body: ArrayBuffer | null, context: RequestContext, rawContext: HttpContext): boolean | Promise<boolean> {
	const vary = context['varyHeaders']
	if (vary && vary.size && !context.response.headers.has('rjweb-server')) rawContext.header('vary', Array.from(vary).join(', '))

	if (context.global.options.performance.eTag && body) {
		const eTag = toETag(body, context.response.cookies.size() ? context.response.cookies.json() : noCookies, context.response.status)

		if (eTag) {
			if (context.headers.get('if-none-match') === eTag) {
				return rawContext.status(Status.NOT_MODIFIED, 'Not Modified').write(context.global.cache.emptyArrayBuffer).then(returnFalse)
			}

			rawContext.header('etag', eTag)
		}
	}

	if (context.url.method === 'HEAD' && context.global.options.methods.head) {
		if (!context.response.headers.has('content-length') && body && !rawContext.getCompression()) rawContext.header('content-length', body.byteLength.toString())
		else if ((!body && !context.response.headers.has('content-length')) || rawContext.getCompression()) rawContext.header('transfer-encoding', 'chunked')

		return rawContext
			.status(context.response.status, context.response.statusText || STATUS_CODES[context.response.status] || 'Unknown')
			.write(context.global.cache.emptyArrayBuffer)
			.then(returnFalse)
	}

	return true
}

/**
 * Write HTTP Headers, synchronously when possible
 * 
 * Only returns a Promise when cookies need to be serialized or a response has to be written
 * @since 9.9.1
*/ export function writeHeadersSync(body: ArrayBuffer | null, context: RequestContext, rawContext: HttpContext): boolean | Promise<boolean> {
	const compression = rawContext.getCompression()
	for (const [ key, value ] of context.response.headers) {
		if (key === 'rjweb-server' || key === 'date') continue
		if (compression && key === 'content-length') continue

		rawContext.header(key, value)
	}

	if (context.response.cookies.size()) {
		return writeCookies(context, rawContext).then(() => writeRest(body, context, rawContext))
	}

	return writeRest(body, context, rawContext)
}

/**
 * Write HTTP Headers
 * @since 9.0.0
*/ export default async function writeHeaders(body: ArrayBuffer | null, context: RequestContext, rawContext: HttpContext): Promise<boolean> {
	return writeHeadersSync(body, context, rawContext)
}
