import { RouteFile } from "rjweb-server"

export default new RouteFile((file) => file
  .http('POST', '/echo', (http) => http
    .onRequest((ctr) => {
      ctr.print({ content: ctr.rawBody, requests: ctr["@"].requests })
    })
  )
)