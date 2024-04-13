import { fileRouter } from "../index.js"

export default new fileRouter.Path('/')
  .http('POST', '/', (http) => http
    .onRequest(async(ctr) => {
      ctr.print({ content: await ctr.rawBody('utf8'), requests: ctr["@"].requests })
    })
  )