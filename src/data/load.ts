import { BotData, Items, Magics, Weapons } from "../types/data";

let data: BotData | null = null;

export async function getData(): Promise<BotData> {
    if (data) return data;

    const itemsFile = Bun.file("./data/items.json", {
        type: "application/json",
    });
    const magicsFile = Bun.file("./data/magics.json", {
        type: "application/json",
    });
    const weaponsFile = Bun.file("./data/weapons.json", {
        type: "application/json",
    });

    const itemsContent: Items = await itemsFile.json();
    const magicsContent: Magics = await magicsFile.json();
    const weaponsContent: Weapons = await weaponsFile.json();

    data = {
        items: itemsContent,
        magics: magicsContent,
        weapons: weaponsContent,
    };

    return data;
}
