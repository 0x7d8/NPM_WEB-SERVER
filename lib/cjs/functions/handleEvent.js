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
async function handleEvent(event, ctr, ctx, ctg, error) {
  switch (event) {
    case "runtimeError": {
      const event2 = ctg.routes.event.find((event3) => event3.name === "runtimeError");
      if (!event2) {
        console.error(error);
        ctr.status(500);
        ctx.content = Buffer.from(`An Error occured
${error.stack}`);
      } else {
        try {
          if (event2.name !== "runtimeError")
            return;
          await Promise.resolve(event2.code(ctr, error));
        } catch (err) {
          console.error(err);
          ctr.status(500);
          ctx.content = Buffer.from(`An Error occured in your Error Event (what the hell?)
${err.stack}`);
        }
      }
    }
    case "httpRequest": {
      let errorStop = false;
      const event2 = ctg.routes.event.find((event3) => event3.name === "httpRequest");
      if (event2) {
        try {
          if (event2.name !== "httpRequest")
            return;
          await Promise.resolve(event2.code(ctr));
        } catch (err) {
          errorStop = true;
          console.error(err);
          ctr.status(500);
          ctx.content = Buffer.from(`An Error occured in your Request Event
${err.stack}`);
        }
      }
      ;
      return errorStop;
    }
    case "http404": {
      let errorStop = false;
      const event2 = ctg.routes.event.find((event3) => event3.name === "http404");
      if (!event2) {
        ctr.status(404).setHeader("Content-Type", "text/plain");
        ctx.content = Buffer.from(`Couldnt find [${ctr.url.method}] ${ctr.url.pathname}`);
      } else {
        try {
          if (event2.name !== "http404")
            return;
          await Promise.resolve(event2.code(ctr));
        } catch (err) {
          errorStop = true;
          console.error(err);
          ctr.status(500);
          ctx.content = Buffer.from(`An Error occured in your Notfound Event
${err.stack}`);
        }
      }
      ;
      return errorStop;
    }
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {});
