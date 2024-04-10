import { fileRouter } from "../index"

export = new fileRouter.Path('/')
  .http('POST', '/', (http) => http
    .onRequest((ctr) => {
      ctr.print({ content: ctr.rawBody, user: ctr["@"].user, requests: ctr["@"].requests })
    })
  )