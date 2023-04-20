import { RouteFile } from "rjweb-server"

export default new RouteFile((file) => file
  .http('GET', '/hello', (http) => http
    .onRequest((ctr) => {
      ctr.print({ hello: 'world', requests: ctr["@"].requests })
    })
  )
)