import GlobalContext from "@/types/internal/classes/GlobalContext"

const mapping: Record<string, string> = Object.freeze({
	pdf: 'application/pdf',
	js: 'text/javascript',
	html: 'text/html',
	css: 'text/css',
	csv: 'text/csv',
	svg: 'image/svg+xml',
	mpeg: 'video/mpeg',
	mp4: 'video/mp4',
	webm: 'video/webm',
	bmp: 'image/bmp',
	gif: 'image/gif',
	jpeg: 'image/jpeg',
	jpg: 'image/jpeg',
	png: 'image/png',
	tiff: 'image/tiff',
	tif: 'image/tiff',
	xml: 'application/xml',
	json: 'application/json',
	txt: 'text/plain',
	doc: 'application/msword',
	docx: 'application/msword',
	ppt: 'application/vnd.ms-powerpoint',
	pptx: 'application/vnd.ms-powerpoint',
	xls: 'application/vnd.ms-excel',
	xlsx: 'application/vnd.ms-excel',
	'7z': 'application/x-7z-compressed',
	zip: 'application/zip',
	tar: 'application/x-tar',
	gz: 'application/gzip',
	gzip: 'application/gzip',
	mp3: 'audio/mpeg',
	aac: 'audio/aac',
	midi: 'audio/midi',
	mid: 'audio/midi',
	wav: 'audio/wav',
	ogg: 'audio/ogg',
	flac: 'audio/flac',
	odt: 'application/vnd.oasis.opendocument.text',
	odp: 'application/vnd.oasis.opendocument.presentation',
	ods: 'application/vnd.oasis.opendocument.spreadsheet',
	avi: 'video/x-msvideo',
	wmv: 'video/x-ms-wmv',
	mov: 'video/quicktime',
	mkv: 'video/x-matroska',
	webp: 'image/webp',
	ico: 'image/x-icon',
	jfif: 'image/jpeg',
	jpe: 'image/jpeg',
	jif: 'image/jpeg',
	jfi: 'image/jpeg',
	svgz: 'image/svg+xml',
	m4a: 'audio/m4a',
	opus: 'audio/opus',
	mpg: 'video/mpeg',
	ogv: 'video/ogg',
	dcm: 'application/dicom',
	xlsb: 'application/vnd.ms-excel.sheet.binary.macroEnabled.12',
	xlsm: 'application/vnd.ms-excel.sheet.macroEnabled.12',
	xltx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.template',
	dotx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.template',
	ppam: 'application/vnd.ms-powerpoint.addin.macroEnabled.12',
	ppsm: 'application/vnd.ms-powerpoint.slideshow.macroEnabled.12',
	potx: 'application/vnd.openxmlformats-officedocument.presentationml.template',
	sldx: 'application/vnd.openxmlformats-officedocument.presentationml.slide',
	thmx: 'application/vnd.ms-officetheme',
	docm: 'application/vnd.ms-word.document.macroEnabled.12',
	dotm: 'application/vnd.ms-word.template.macroEnabled.12',
	ppsx: 'application/vnd.openxmlformats-officedocument.presentationml.slideshow',
	sldm: 'application/vnd.ms-powerpoint.slide.macroEnabled.12',
	xlam: 'application/vnd.ms-excel.addin.macroEnabled.12',
	dot: 'application/msword',
	pot: 'application/vnd.ms-powerpoint',
	pps: 'application/vnd.ms-powerpoint',
	sld: 'application/vnd.ms-powerpoint',
	xlt: 'application/vnd.ms-excel',
	xla: 'application/vnd.ms-excel',
	eml: 'message/rfc822',
	vcf: 'text/vcard',
	ics: 'text/calendar',
	abw: 'application/x-abiword',
	azw: 'application/vnd.amazon.ebook'
})

/**
 * Parse File Name into a Content Type or empty string
 * @since 4.0.0
*/ export default function parseContentType(name: string, customTypes: GlobalContext['contentTypes']): string {
	for (const [ key, value ] of customTypes) {
		if (name.endsWith(key)) return value
	}

	const dot = name.lastIndexOf('.')
	if (dot === -1) return 'application/octet-stream'

	const end = name.slice(dot + 1)
	if (!end) return 'application/octet-stream'

	return mapping[end] ?? 'application/octet-stream'
}