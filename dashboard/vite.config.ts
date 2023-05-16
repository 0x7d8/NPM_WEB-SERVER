import { defineConfig } from "vite"

import react from "@vitejs/plugin-react"
import tsConfigPaths from "vite-tsconfig-paths"
import { viteSingleFile } from "vite-plugin-singlefile"
import { createHtmlPlugin } from "vite-plugin-html"

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		react(),
		tsConfigPaths(),
		createHtmlPlugin(),
		viteSingleFile({
			removeViteModuleLoader: true
		})
	]
})