import { GlobalContext, RequestContext } from "../interfaces/context"
import handleCompressType, { CompressMapping } from "./handleCompressType"
import { HTTPRequestContext } from "../interfaces/external"

export default function handleCompression(ctr: HTTPRequestContext, ctx: RequestContext, ctg: GlobalContext, endRequest: boolean) {
	if (endRequest) return

	if (!ctx.compressed && String(ctr.headers.get('accept-encoding', '')).includes(CompressMapping[ctg.options.compression])) {
		ctx.sendHeaders['Content-Encoding'] = CompressMapping[ctg.options.compression]
		ctx.sendHeaders['Vary'] = 'Accept-Encoding'

		// Write Headers
		for (const header in ctx.sendHeaders) {
			ctr.rawRes.writeHeader(header, ctx.sendHeaders[header])
		}

		const compression = handleCompressType(ctg.options.compression)
		compression.on('data', (data: Buffer) => {
			ctg.data.outgoing.total += data.byteLength
			ctg.data.outgoing[ctx.previousHours[4]] += data.byteLength

			ctr.rawRes.write(data)
		}).once('close', () => ctr.rawRes.end())

		compression.end(ctx.content)
	} else {
		ctg.data.outgoing.total += ctx.content.byteLength
		ctg.data.outgoing[ctx.previousHours[4]] += ctx.content.byteLength

		ctr.rawRes.end(ctx.content)
	}
}