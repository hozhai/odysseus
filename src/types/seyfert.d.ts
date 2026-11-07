import type {
  ParseClient,
  Client,
  Message,
  TopLevelBuilders,
} from "seyfert";

declare module "seyfert" {
  interface SeyfertRegistry {
    client: ParseClient<Client<true>>; // Gateway
  }
}

export interface Command {
  name: string;
  type: 1;
  nsfw: boolean;
  description: string;
  contexts: (0 | 1 | 2)[];
  integration_types: 0[];
}

export type ComponentsV2Components = Exclude<
  NonNullable<Parameters<Message["edit"]>[0]["components"]>,
  TopLevelBuilders[]
>;
