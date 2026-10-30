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

function validateData(data: BotData): void {
  const errors: string[] = [];

  validateRecordIds("items", data.items, errors);
  validateRecordIds("modifiers", data.modifiers, errors);
  validateRecordIds("enchants", data.enchants, errors);
  validateRecordIds("gems", data.gems, errors);

  const modifierNames = new Set(
    Object.values(data.modifiers).map((modifier) => modifier.name)
  );

  for (const [itemId, item] of Object.entries(data.items)) {
    for (const name of item.validModifiers ?? []) {
      if (!modifierNames.has(name)) {
        errors.push(
          `items.${itemId}.validModifiers: unknown modifier "${name}"`
        );
      }
    }
  }

  const magicNames = new Set(data.magics.map((magic) => magic.name));

  for (const magic of data.magics) {
    for (const relation of ["over", "neutral", "under"] as const) {
      for (const name of magic.clash[relation]) {
        if (!magicNames.has(name)) {
          errors.push(
            `magics.${magic.name}.clash.${relation}: unknown magic "${name}"`
          );
        }
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(`Invalid data references:\n${errors.join("\n")}`);
  }
}

function validateRecordIds<T extends { id: string }>(
  collection: string,
  records: Record<string, T>,
  errors: string[]
): void {
  for (const [key, record] of Object.entries(records)) {
    if (key !== record.id) {
      errors.push(`${collection}.${key}.id: does not match map key`);
    }
  }
}
