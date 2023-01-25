import * as fs from "fs"

export const getAllFiles = (dirPath: string, arrayOfFiles?: string[]) => {
	arrayOfFiles = arrayOfFiles || []

	const files = fs.readdirSync(dirPath)
	files.forEach((file) => {
		if (fs.statSync(`${dirPath}/${file}`).isDirectory()) {
			arrayOfFiles = getAllFiles(`${dirPath}/${file}`, arrayOfFiles)
		} else {
			let filePath = `${dirPath}/${file}`
			arrayOfFiles.push(filePath)
		}
	}); return arrayOfFiles
}

export const getAllFilesFilter = (dirPath: string, suffix: string, arrayOfFiles?: string[]) => {
	arrayOfFiles = arrayOfFiles || []

	arrayOfFiles = getAllFiles(dirPath, arrayOfFiles).filter((file) => file.endsWith(suffix))
	return arrayOfFiles
}