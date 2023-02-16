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
var valueCollection_exports = {};
__export(valueCollection_exports, {
  default: () => ValueCollection
});
module.exports = __toCommonJS(valueCollection_exports);
class ValueCollection {
  /** Create a New Collection */
  constructor(data, parse) {
    this.data = {};
    data = data != null ? data : {};
    parse = parse != null ? parse : (value) => value;
    for (const key in data) {
      this.data[key] = parse(data[key]);
    }
  }
  /** Check if a Key exists */
  has(key) {
    return key in this.data;
  }
  /** Get a Key */
  get(key) {
    return this.data[key];
  }
  /** Set a Key */
  set(key, value) {
    const existed = key in this.data;
    this.data[key] = value;
    return existed;
  }
  /** Get The Amount of Stored Objects */
  objectCount() {
    return Object.keys(this.data).length;
  }
  /** Clear the Stored Objects */
  clear(excluded) {
    excluded = excluded != null ? excluded : [];
    let keys = 0;
    for (const key in this.data) {
      if (excluded.includes(key))
        continue;
      delete this.data[key];
      keys++;
    }
    ;
    return keys;
  }
  /** Get all Objects as JSON */
  toJSON(excluded) {
    excluded = excluded != null ? excluded : [];
    let keys = {};
    for (const key in this.data) {
      if (excluded.includes(key))
        continue;
      keys[key] = this.data[key];
    }
    ;
    return keys;
  }
  /** Get all Values as Array */
  toArray(excluded) {
    excluded = excluded != null ? excluded : [];
    let keys = [];
    for (const key in this.data) {
      if (excluded.includes(key))
        continue;
      keys.push(this.data[key]);
    }
    ;
    return keys;
  }
  /** Loop over all Keys */
  forEach(callback, excluded) {
    callback = callback != null ? callback : () => void 0;
    excluded = excluded != null ? excluded : [];
    let keys = 0;
    for (const key in this.data) {
      if (excluded.includes(key))
        continue;
      callback(key, this.data[key]);
      keys++;
    }
    ;
    return keys;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {});
