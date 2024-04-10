import fs from "fs"

export async function fileExists(path: string): Promise<boolean> {
	return new Promise((resolve) => {
		fs.stat(path, (err, stats) => {
			resolve(!err && (stats.isFile() || stats.isFIFO()))
		})
	})
}