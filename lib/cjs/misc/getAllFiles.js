var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var getAllFiles_exports = {};
__export(getAllFiles_exports, {
  getAllFiles: () => getAllFiles,
  getAllFilesFilter: () => getAllFilesFilter
});
module.exports = __toCommonJS(getAllFiles_exports);
var fs = __toESM(require("fs"));
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  getAllFiles,
  getAllFilesFilter
});
