import { server } from "../index"

export = new server.routeFile((file) => file
  .http('GET', '/hello', (http) => http
    .onRequest((ctr) => {
      ctr.print({ hello: 'world', requests: ctr["@"].requests })
    })
  )
)