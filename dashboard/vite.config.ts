import { defineConfig } from "vite"

import react from "@vitejs/plugin-react"
import tsConfigPaths from "vite-tsconfig-paths"
import { viteSingleFile } from "vite-plugin-singlefile"

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		react(),
		tsConfigPaths(),
		viteSingleFile({
			removeViteModuleLoader: true,
			useRecommendedBuildConfig: true
		})
	]
})