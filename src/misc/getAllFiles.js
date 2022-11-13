const fs = require('node:fs')

const getAllFiles = (dirPath, arrayOfFiles) => {    
    const files = fs.readdirSync(dirPath)
    arrayOfFiles = arrayOfFiles || []
    files.forEach((file) => {
        if (fs.statSync(dirPath + '/' + file).isDirectory()) {
            arrayOfFiles = getAllFiles(dirPath + '/' + file, arrayOfFiles)
        } else {
            let filePath = dirPath + '/' + file
            arrayOfFiles.push(filePath)
        }
    }); return arrayOfFiles
}

const getAllFilesFilter = (dirPath, suffix, arrayOfFiles) => {
    arrayOfFiles = getAllFiles(dirPath, arrayOfFiles).filter((file) => file.endsWith(suffix))
    return arrayOfFiles
}

module.exports.getAllFilesFilter = getAllFilesFilter
module.exports.getAllFiles = getAllFiles