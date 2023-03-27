import { promises as fs } from "fs"

export const getAllFiles = async(dirPath: string, arrayOfFiles?: string[]): Promise<string[]> => {
	arrayOfFiles = arrayOfFiles || []

	const files = await fs.readdir(dirPath)
	for (let index = 0; index <= files.length - 1; index++) {
		const file = files[index]

		if ((await fs.stat(`${dirPath}/${file}`)).isDirectory()) arrayOfFiles = await getAllFiles(`${dirPath}/${file}`, arrayOfFiles)
		else {
			let filePath = `${dirPath}/${file}`
			arrayOfFiles.push(filePath)
		}
	}

	return arrayOfFiles
}

export const getAllFilesFilter = async(dirPath: string, suffix: string, arrayOfFiles?: string[]): Promise<string[]> => {
	arrayOfFiles = arrayOfFiles || []

	arrayOfFiles = (await getAllFiles(dirPath, arrayOfFiles)).filter((file) => file.endsWith(suffix))

	return arrayOfFiles
}