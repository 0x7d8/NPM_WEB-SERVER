import { fH, HTMLContent } from "../classes/HTMLBuilder"

/**
 * Parse HTML Content to remove XSS (if used properly)
 * @example
 * ```
 * const userInput = '<script>alert("OOps")</script>'
 * 
 * const insecure = `
 *   <p>Message:</p>
 *   <p>${userInput}</p>
 * `
 * 
 * const secure = html`
 *   <p>Message:</p>
 *   <p>${userInput}</p>
 * `
 * ```
 * @since 8.7.0
*/ export default function html(parts: TemplateStringsArray, ...variables: HTMLContent[]) {
	let result = ''

	for (let i = 0; i < parts.length; i++) {
		result += parts[i]
		if (variables[i]) result += fH(String(variables[i]))
	}

	return result
}