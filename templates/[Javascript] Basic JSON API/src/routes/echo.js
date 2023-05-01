import { server } from "../index.js"

export default new server.routeFile((file) => file
  .http('POST', '/echo', (http) => http
    .onRequest((ctr) => {
      ctr.print({ content: ctr.rawBody, requests: ctr["@"].requests })
    })
  )
)