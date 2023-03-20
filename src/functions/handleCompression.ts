import { GlobalContext, RequestContext } from "../interfaces/context"
import handleCompressType, { CompressMapping } from "./handleCompressType"
import { HTTPRequestContext } from "../interfaces/external"

export default function handleCompression(ctr: HTTPRequestContext, ctx: RequestContext, ctg: GlobalContext) {
	if (!ctx.compressed && !ctr.rawRes.headersSent && String(ctr.headers.get('accept-encoding', '')).includes(CompressMapping[ctg.options.compression])) {
		ctr.rawRes.setHeader('Content-Encoding', CompressMapping[ctg.options.compression])
		ctr.rawRes.setHeader('Vary', 'Accept-Encoding')

		const compression = handleCompressType(ctg.options.compression)
		compression.on('data', (data: Buffer) => {
			ctg.data.outgoing.total += data.byteLength
			ctg.data.outgoing[ctx.previousHours[4]] += data.byteLength
		})

		compression.pipe(ctr.rawRes)
		compression.end(ctx.content, 'binary')
	} else {
		ctg.data.outgoing.total += ctx.content.byteLength
		ctg.data.outgoing[ctx.previousHours[4]] += ctx.content.byteLength

		ctr.rawRes.end(ctx.content, 'binary')
	}
}