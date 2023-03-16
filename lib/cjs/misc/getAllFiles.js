var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var getAllFiles_exports = {};
__export(getAllFiles_exports, {
  getAllFiles: () => getAllFiles,
  getAllFilesFilter: () => getAllFilesFilter
});
module.exports = __toCommonJS(getAllFiles_exports);
var import_fs = require("fs");
const getAllFiles = async (dirPath, arrayOfFiles) => {
  arrayOfFiles = arrayOfFiles || [];
  const files = await import_fs.promises.readdir(dirPath);
  for (let index = 0; index <= files.length - 1; index++) {
    const file = files[index];
    if ((await import_fs.promises.stat(`${dirPath}/${file}`)).isDirectory())
      arrayOfFiles = await getAllFiles(`${dirPath}/${file}`, arrayOfFiles);
    else {
      let filePath = `${dirPath}/${file}`;
      arrayOfFiles.push(filePath);
    }
  }
  return arrayOfFiles;
};
const getAllFilesFilter = async (dirPath, suffix, arrayOfFiles) => {
  arrayOfFiles = arrayOfFiles || [];
  arrayOfFiles = (await getAllFiles(dirPath, arrayOfFiles)).filter((file) => file.endsWith(suffix));
  return arrayOfFiles;
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  getAllFiles,
  getAllFilesFilter
});
