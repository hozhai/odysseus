import yaml from "js-yaml";
import type {
  BotData,
  Enchants,
  Gems,
  Items,
  Magics,
  Modifiers,
  Weapons,
} from "../types";

let data: BotData | null = null;

export async function getData(): Promise<BotData> {
  if (data) return data;

  const itemsFile = Bun.file("./data/items.yaml");
  const magicsFile = Bun.file("./data/magics.yaml");
  const weaponsFile = Bun.file("./data/weapons.yaml");
  const enchantsFile = Bun.file("./data/enchants.yaml");
  const modifiersFile = Bun.file("./data/modifiers.yaml");
  const gemsFile = Bun.file("./data/gems.yaml");

  const itemsText = await itemsFile.text();
  const magicsText = await magicsFile.text();
  const weaponsText = await weaponsFile.text();
  const enchantsText = await enchantsFile.text();
  const modifiersText = await modifiersFile.text();
  const gemsText = await gemsFile.text();

  const itemsContent = yaml.load(itemsText) as Items;
  const magicsContent = yaml.load(magicsText) as Magics;
  const weaponsContent = yaml.load(weaponsText) as Weapons;
  const enchantsContent = yaml.load(enchantsText) as Enchants;
  const modifiersContent = yaml.load(modifiersText) as Modifiers;
  const gemsContent = yaml.load(gemsText) as Gems;

  data = {
    items: itemsContent,
    magics: magicsContent,
    weapons: weaponsContent,
    enchants: enchantsContent,
    modifiers: modifiersContent,
    gems: gemsContent,
  };

  return data;
}
