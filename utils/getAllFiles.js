const getAllFiles = function (dirPath, arrayOfFiles) {
    const fs = require('node:fs')
    
    files = fs.readdirSync(dirPath)
    arrayOfFiles = arrayOfFiles || []
    files.forEach(function (file) {
        if (fs.statSync(dirPath + "/" + file).isDirectory()) {
            arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles)
        } else {
            let filePath = dirPath + "/" + file
            arrayOfFiles.push(filePath)
        }
    })
    return arrayOfFiles
}

const getAllFilesFilter = function (dirPath, suffix, arrayOfFiles) {
    arrayOfFiles = getAllFiles(dirPath, arrayOfFiles).filter(file => file.endsWith(suffix))
    return arrayOfFiles
}

exports.getAllFilesFilter = getAllFilesFilter
exports.getAllFiles = getAllFiles