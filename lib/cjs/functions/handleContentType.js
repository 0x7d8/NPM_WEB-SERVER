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
var handleContentType_exports = {};
__export(handleContentType_exports, {
  default: () => handleContentType
});
module.exports = __toCommonJS(handleContentType_exports);
function handleContentType(name, ctg) {
  for (const contentType of Object.keys(ctg.options.contentTypes)) {
    if (name.endsWith(contentType))
      return ctg.options.contentTypes[contentType];
  }
  if (name.endsWith(".pdf"))
    return "application/pdf";
  if (name.endsWith(".js"))
    return "text/javascript";
  if (name.endsWith(".html"))
    return "text/html";
  if (name.endsWith(".css"))
    return "text/css";
  if (name.endsWith(".csv"))
    return "text/csv";
  if (name.endsWith(".svg"))
    return "image/svg+xml";
  if (name.endsWith(".mpeg"))
    return "video/mpeg";
  if (name.endsWith(".mp4"))
    return "video/mp4";
  if (name.endsWith(".webm"))
    return "video/webm";
  if (name.endsWith(".bmp"))
    return "image/bmp";
  if (name.endsWith(".gif"))
    return "image/gif";
  if (name.endsWith(".jpeg") || name.endsWith(".jpg"))
    return "image/jpeg";
  if (name.endsWith(".png"))
    return "image/png";
  if (name.endsWith(".tiff") || name.endsWith(".tif"))
    return "image/tiff";
  if (name.endsWith(".xml"))
    return "application/xml";
  if (name.endsWith(".json"))
    return "application/json";
  if (name.endsWith(".txt"))
    return "text/plain";
  if (name.endsWith(".doc") || name.endsWith(".docx"))
    return "application/msword";
  if (name.endsWith(".ppt") || name.endsWith(".pptx"))
    return "application/vnd.ms-powerpoint";
  if (name.endsWith(".xls") || name.endsWith(".xlsx"))
    return "application/vnd.ms-excel";
  if (name.endsWith(".7z"))
    return "application/x-7z-compressed";
  if (name.endsWith(".zip"))
    return "application/zip";
  if (name.endsWith(".tar"))
    return "application/x-tar";
  if (name.endsWith(".gz") || name.endsWith(".gzip"))
    return "application/gzip";
  if (name.endsWith(".mp3"))
    return "audio/mpeg";
  if (name.endsWith(".aac"))
    return "audio/aac";
  if (name.endsWith(".midi") || name.endsWith(".mid"))
    return "audio/midi";
  if (name.endsWith(".wav"))
    return "audio/wav";
  if (name.endsWith(".ogg"))
    return "audio/ogg";
  if (name.endsWith(".flac"))
    return "audio/flac";
  if (name.endsWith(".odt"))
    return "application/vnd.oasis.opendocument.text";
  if (name.endsWith(".odp"))
    return "application/vnd.oasis.opendocument.presentation";
  if (name.endsWith(".ods"))
    return "application/vnd.oasis.opendocument.spreadsheet";
  if (name.endsWith(".avi"))
    return "video/x-msvideo";
  if (name.endsWith(".wmv"))
    return "video/x-ms-wmv";
  if (name.endsWith(".mov"))
    return "video/quicktime";
  if (name.endsWith(".mkv"))
    return "video/x-matroska";
  if (name.endsWith(".webp"))
    return "image/webp";
  if (name.endsWith(".ico"))
    return "image/x-icon";
  if (name.endsWith(".jfif") || name.endsWith(".jpe") || name.endsWith(".jif") || name.endsWith(".jfi"))
    return "image/jpeg";
  if (name.endsWith(".svgz"))
    return "image/svg+xml";
  if (name.endsWith(".m4a"))
    return "audio/m4a";
  if (name.endsWith(".opus"))
    return "audio/opus";
  if (name.endsWith(".mpg"))
    return "video/mpeg";
  if (name.endsWith(".ogv"))
    return "video/ogg";
  if (name.endsWith(".dcm"))
    return "application/dicom";
  if (name.endsWith(".xlsb"))
    return "application/vnd.ms-excel.sheet.binary.macroEnabled.12";
  if (name.endsWith(".xlsm"))
    return "application/vnd.ms-excel.sheet.macroEnabled.12";
  if (name.endsWith(".xltx"))
    return "application/vnd.openxmlformats-officedocument.spreadsheetml.template";
  if (name.endsWith(".dotx"))
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.template";
  if (name.endsWith(".ppam"))
    return "application/vnd.ms-powerpoint.addin.macroEnabled.12";
  if (name.endsWith(".ppsm"))
    return "application/vnd.ms-powerpoint.slideshow.macroEnabled.12";
  if (name.endsWith(".potx"))
    return "application/vnd.openxmlformats-officedocument.presentationml.template";
  if (name.endsWith(".sldx"))
    return "application/vnd.openxmlformats-officedocument.presentationml.slide";
  if (name.endsWith(".thmx"))
    return "application/vnd.ms-officetheme";
  if (name.endsWith(".docm"))
    return "application/vnd.ms-word.document.macroEnabled.12";
  if (name.endsWith(".dotm"))
    return "application/vnd.ms-word.template.macroEnabled.12";
  if (name.endsWith(".ppsx"))
    return "application/vnd.openxmlformats-officedocument.presentationml.slideshow";
  if (name.endsWith(".sldm"))
    return "application/vnd.ms-powerpoint.slide.macroEnabled.12";
  if (name.endsWith(".xlam"))
    return "application/vnd.ms-excel.addin.macroEnabled.12";
  if (name.endsWith(".xls"))
    return "application/vnd.ms-excel";
  if (name.endsWith(".dot"))
    return "application/msword";
  if (name.endsWith(".pot"))
    return "application/vnd.ms-powerpoint";
  if (name.endsWith(".pps"))
    return "application/vnd.ms-powerpoint";
  if (name.endsWith(".sld"))
    return "application/vnd.ms-powerpoint";
  if (name.endsWith(".xlt"))
    return "application/vnd.ms-excel";
  if (name.endsWith(".xla"))
    return "application/vnd.ms-excel";
  if (name.endsWith(".ppt"))
    return "application/vnd.ms-powerpoint";
  if (name.endsWith(".eml"))
    return "message/rfc822";
  if (name.endsWith(".vcf"))
    return "text/vcard";
  if (name.endsWith(".ics"))
    return "text/calendar";
  if (name.endsWith(".vcf"))
    return "text/x-vcard";
  return "";
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {});
