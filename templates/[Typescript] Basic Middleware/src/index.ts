import { MiddlewareBuilder } from "rjweb-server"

const { init } = new MiddlewareBuilder()
  .init((lCtx, config) => {
    console.log('middleware initted!')
  })
  .http((lCtx, end, ctr, ctx, ctg) => {
    if (ctr.queries.has('end')) {
      end()
      return ctr.status(666, 'Devil').print('You wanted to end the request...')
    }
  })
  .build()

export { init }