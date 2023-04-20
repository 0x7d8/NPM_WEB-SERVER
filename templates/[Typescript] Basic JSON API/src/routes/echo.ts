import { RouteFile } from "rjweb-server"
import { WebServerContext } from "../types/context"

export = new RouteFile((file) => file
  .http<WebServerContext>('POST', '/echo', (http) => http
    .onRequest((ctr) => {
      ctr.print({ content: ctr.rawBody, requests: ctr["@"].requests })
    })
  )
)