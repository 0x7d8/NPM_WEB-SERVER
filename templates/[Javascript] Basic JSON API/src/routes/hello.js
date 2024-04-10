import { fileRouter } from "../index.js"

export default new fileRouter.Path('/')
  .http('GET', '/', (http) => http
    .onRequest((ctr) => {
      ctr.print({ hello: 'world', requests: ctr["@"].requests })
    })
  )