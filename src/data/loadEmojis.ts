import { parse } from "@/utils";
import { EmojiDataSchema, type EmojiData } from "./schemas";
import { env } from "bun";

let emojis: EmojiData | null = null;

export async function getEmojis(): Promise<EmojiData> {
  if (emojis) return emojis;

  if (env.BOT_ENV === "prod") {
    emojis = await parse("./data/emojis-prod.yaml", EmojiDataSchema);
  } else if (env.BOT_ENV === "dev") {
    emojis = await parse("./data/emojis-dev.yaml", EmojiDataSchema);
  } else {
    throw Error("env.BOT_ENV must be set to either `prod` or `dev`.");
  }

  return emojis;
}
