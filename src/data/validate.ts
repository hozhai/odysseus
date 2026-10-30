import type { BotData } from "./schemas";

export function validateData(data: BotData): void {
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
