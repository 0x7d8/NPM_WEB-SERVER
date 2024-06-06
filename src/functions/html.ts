export type HTMLContent =
	| string
	| number
	| boolean
	| undefined

const replace: Record<string, string> = {
	'&': '&amp;',
	'<': '&lt;',
	'>': '&gt;',
	'"': '&quot;',
	'\'': '&#039;'
}

/**
 * Parse HTML Content to remove XSS (if used properly)
 * @example
 * ```
 * const userInput = '<script>alert("OOps")</script>'
 * 
 * const insecure = `
 *   <p>Message:</p>
 *   <p>${userInput}</p>
 * ` // XSS Vulnerable
 * 
 * const secure = html`
 *   <p>Message:</p>
 *   <p>${userInput}</p>
 * ` // XSS Safe
 * ```
 * @since 8.7.0
*/ export default function html(parts: TemplateStringsArray, ...variables: HTMLContent[]) {
	let result = ''

	for (let i = 0; i < parts.length; i++) {
		result += parts[i]
		if (variables[i]) result += String(variables[i]).replace(/[&<>"']/g, (m) => replace[m])
	}

	return result
}