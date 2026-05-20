import { BotData, Items, Magics, Weapons } from "../types/data";

let data: BotData | null = null;

export async function getData(): Promise<BotData> {
  if (data) return data;

  let itemsFile = Bun.file("./data/items.json", {
    type: "application/json",
  });
  let magicsFile = Bun.file("./data/magics.json", {
    type: "application/json",
  });
  let weaponsFile = Bun.file("./data/weapons.json", {
    type: "application/json",
  });

  let itemsContent: Items = await itemsFile.json();
  let magicsContent: Magics = await magicsFile.json();
  let weaponsContent: Weapons = await weaponsFile.json();

  data = {
    items: itemsContent,
    magics: magicsContent,
    weapons: weaponsContent,
  };

  return data;
}
