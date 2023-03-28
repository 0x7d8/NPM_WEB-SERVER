const { MiddlewareBuilder } = require('rjweb-server')

module.exports = new MiddlewareBuilder()
  .http((lCtx, stop, ctr, ctx, ctg) => {
    ctr.printEmpty = () => {
      ctx.content = Buffer.alloc(0)

      return ctr
    }
  })
  .build()