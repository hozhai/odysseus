import { Client, ParseClient } from "seyfert";

declare module "seyfert" {
  // oxlint-disable-next-line typescript/no-empty-object-type
  interface UsingClient extends ParseClient<Client<true>> {}
}
