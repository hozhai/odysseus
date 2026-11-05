import {
  EnchantsSchema,
  GemsSchema,
  ItemsSchema,
  MagicsSchema,
  ModifiersSchema,
  WeaponsSchema,
  type BotData,
} from "@data";
import { parse, validateData } from "@utils";

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
