import { load } from "js-yaml";
import {
  EnchantsSchema,
  GemsSchema,
  ItemsSchema,
  MagicsSchema,
  ModifiersSchema,
  WeaponsSchema,
  type BotData,
} from "./schemas";
import type z from "zod";
import { validateData } from "./validate";

let data: BotData | null = null;

export async function getData(): Promise<BotData> {
  if (data) return data;

  const itemsContent = await parse("./data/items.yaml", ItemsSchema);
  const magicsContent = await parse("./data/magics.yaml", MagicsSchema);
  const weaponsContent = await parse("./data/weapons.yaml", WeaponsSchema);
  const enchantsContent = await parse("./data/enchants.yaml", EnchantsSchema);
  const modifiersContent = await parse(
    "./data/modifiers.yaml",
    ModifiersSchema
  );
  const gemsContent = await parse("./data/gems.yaml", GemsSchema);

  const parsedData: BotData = {
    items: itemsContent,
    magics: magicsContent,
    weapons: weaponsContent,
    enchants: enchantsContent,
    modifiers: modifiersContent,
    gems: gemsContent,
  };

  validateData(parsedData);
  data = parsedData;

  return data;
}

async function parse<T>(path: string, schema: z.ZodType<T>): Promise<T> {
  const yaml: unknown = load(await Bun.file(path).text());
  const result = schema.safeParse(yaml);

  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `Invalid ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");

    throw new Error(`Invalid ${path}:\n${details}`);
  }

  return result.data;
}
