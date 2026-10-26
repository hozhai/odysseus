import type { ParseClient, Client } from "seyfert";

declare module "seyfert" {
  interface SeyfertRegistry {
    client: ParseClient<Client<true>>; // Gateway
  }
}
