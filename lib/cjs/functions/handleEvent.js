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
var handleEvent_exports = {};
__export(handleEvent_exports, {
  default: () => handleEvent
});
module.exports = __toCommonJS(handleEvent_exports);
async function handleEvent(event, ctr, ctx, ctg) {
  switch (event) {
    case "error": {
      const event2 = ctg.routes.event.find((event3) => event3.event === "error");
      if (!event2) {
        console.log(ctr.error);
        ctr.status(500);
        ctx.content = Buffer.from(`An Error occured
${ctr.error.stack}`);
      } else {
        Promise.resolve(event2.code(ctr)).catch((e) => {
          console.log(e);
          ctr.status(500);
          ctx.content = Buffer.from(`An Error occured in your Error Event (what the hell?)
${e.stack}`);
        });
      }
    }
    case "request": {
      let errorStop = false;
      const event2 = ctg.routes.event.find((event3) => event3.event === "request");
      if (event2) {
        await Promise.resolve(event2.code(ctr)).catch((e) => {
          errorStop = true;
          console.log(e);
          ctr.status(500);
          ctx.content = Buffer.from(`An Error occured in your Request Event
${e.stack}`);
        });
      }
      ;
      return errorStop;
    }
    case "notfound": {
      let errorStop = false;
      const event2 = ctg.routes.event.find((event3) => event3.event === "notfound");
      if (!event2) {
        ctr.status(404).setHeader("Content-Type", "text/plain");
        ctx.content = Buffer.from(`Couldnt find [${ctr.url.method}] ${ctr.url.pathname}`);
      } else {
        await Promise.resolve(event2.code(ctr)).catch((e) => {
          errorStop = true;
          console.log(e);
          ctr.status(500);
          ctx.content = Buffer.from(`An Error occured in your Notfound Event
${e.stack}`);
        });
      }
      ;
      return errorStop;
    }
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {});
