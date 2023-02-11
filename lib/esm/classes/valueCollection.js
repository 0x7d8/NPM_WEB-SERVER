class valueCollection {
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
export {
  valueCollection as default
};
