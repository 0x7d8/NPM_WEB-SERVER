import * as fs from "fs";
const getAllFiles = (dirPath, arrayOfFiles) => {
  arrayOfFiles = arrayOfFiles || [];
  const files = fs.readdirSync(dirPath);
  files.forEach((file) => {
    if (fs.statSync(`${dirPath}/${file}`).isDirectory()) {
      arrayOfFiles = getAllFiles(`${dirPath}/${file}`, arrayOfFiles);
    } else {
      let filePath = `${dirPath}/${file}`;
      arrayOfFiles.push(filePath);
    }
  });
  return arrayOfFiles;
};
const getAllFilesFilter = (dirPath, suffix, arrayOfFiles) => {
  arrayOfFiles = arrayOfFiles || [];
  arrayOfFiles = getAllFiles(dirPath, arrayOfFiles).filter((file) => file.endsWith(suffix));
  return arrayOfFiles;
};
export {
  getAllFiles,
  getAllFilesFilter
};
