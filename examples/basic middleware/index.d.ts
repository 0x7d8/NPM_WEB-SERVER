import { HTTPRequestContext } from "rjweb-server"

declare module "my-middleware" {
  export interface Props {
    printEmpty: () => HTTPRequestContext
  }
}