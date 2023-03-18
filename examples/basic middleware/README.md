<h1 align="center">Welcome to my-middleware 👋</h1>
<div align="center">
  A Wonderful Middleware
</div>

## Install

```sh
npm i my-middleware
```

## Add Intellisense
```ts
// webserver.d.ts

import { MiddlewareToHTTPContext } from "rjweb-server"
import { Props as AdditionalProps1 } from "my-middleware"

declare module "rjweb-server" {
  interface HTTPRequestContext extends MiddlewareToHTTPContext<[ AdditionalProps1 ]> {}
}
```

## Usage

(Explain what your Middleware does and how to use it)

## Author

👤 **your_name** 

## Show your support

Give a Star if this project helped you!

## 📝 License

Copyright © 2023 your_name.<br />
This project is MIT licensed.