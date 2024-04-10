import { fileRouter } from "../index"

export = new fileRouter.Path('/')
  .http('GET', '/', (http) => http
    .onRequest((ctr) => {
      ctr.print(`Hello, ${ctr["@"].user}`)
    })
  )