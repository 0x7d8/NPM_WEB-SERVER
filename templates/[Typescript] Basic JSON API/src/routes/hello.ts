import { RouteFile } from "rjweb-server"
import { WebServerContext } from "../types/context"

export = new RouteFile((file) => file
  .http<WebServerContext>('GET', '/hello', (http) => http
    .onRequest((ctr) => {
      ctr.print({ hello: 'world', requests: ctr["@"].requests })
    })
  )
)