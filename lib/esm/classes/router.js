import RouteBlock from "./router/routeBlock";
const pathParser = (path, removeSingleSlash) => {
  path = path.replace(/\/{2,}/g, "/");
  if (path.endsWith("/") && path !== "/")
    path = path.slice(0, -1);
  if (!path.startsWith("/") && path !== "/")
    path = `/${path}`;
  if (path.includes("/?"))
    path = path.replace("/?", "?");
  return removeSingleSlash && path === "/" ? "" : path;
};
class RouteList {
  /** List of Routes */
  constructor() {
    this.routes = [];
    this.events = [];
    this.statics = [];
    this.externals = [];
  }
  /**
   * Add a new Event Response
   * @since 4.0.0
  */
  event(event, code) {
    if (this.events.some((obj) => obj.event === event))
      return false;
    return this.events.push({
      event,
      code
    }) - 1;
  }
  /**
   * Add a new Block of Routes with a Prefix
   * @since 4.0.0
  */
  prefix(prefix) {
    const routeBlock = new RouteBlock(prefix);
    this.externals.push({ method: "get", object: routeBlock });
    return routeBlock;
  }
  /**
    * Internal Method for Generating Routes Object
    * @sync This Function generates routes synchronously
    * @ignore This is meant for internal use
    * @since 3.1.0
   */
  getRoutes() {
    for (const external of this.externals) {
      const result = external.object[external.method]();
      this.routes.push(...result.routes);
      this.statics.push(...result.statics);
    }
    return { events: this.events, routes: this.routes, statics: this.statics, authChecks: this.authChecks };
  }
}
export {
  RouteList as default,
  pathParser
};
