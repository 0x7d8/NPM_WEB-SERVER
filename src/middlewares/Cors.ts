import Middleware from "@/classes/Middleware"

export default new Middleware<{
	allowAll: false
	origins?: string[]
	methods?: string[]
	headers?: string[]
	exposeHeaders?: string[]
	credentials?: boolean
	maxAge?: number
} | {
	allowAll: true
	maxAge?: number
}>('Built-in CORS Middleware', '1.0.0')
	.httpRequest((config, server, context, ctr, end) => {
		if (config.allowAll || config.origins?.length) ctr.headers.set('access-control-allow-origin', config.allowAll ? '*' : config.origins?.join(', '))
		if (config.allowAll || config.methods?.length) ctr.headers.set('access-control-allow-methods', config.allowAll ? '*' : config.methods?.join(', '))
		if (config.allowAll || config.headers?.length) ctr.headers.set('access-control-allow-headers', config.allowAll ? '*' : config.headers?.join(', '))
		if (config.allowAll || config.exposeHeaders?.length) ctr.headers.set('access-control-expose-headers', config.allowAll ? '*' : config.exposeHeaders?.join(', '))
		if (config.allowAll || config.credentials) ctr.headers.set('access-control-allow-credentials', config.allowAll ? '*' : 'true')
		if (config.maxAge) ctr.headers.set('access-control-max-age', config.maxAge.toString())

		if (ctr.url.method === 'OPTIONS' && !context.route) {
			return end(ctr.status(ctr.$status.NO_CONTENT))
		}
	})
	.export()