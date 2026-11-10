import { describe, expect, test } from "bun:test";
import { getData } from "@data";
import {
  findEnchantById,
  findEnchantByName,
  findGemById,
  findItemById,
  findItemByName,
  findMagicByName,
  findModifierById,
  findModifierByName,
} from "@utils";

describe("find by ID", () => {
  test("returns matching items, enchants, modifiers, and gems", async () => {
    const data = await getData();
    const item = Object.values(data.items)[0]!;
    const enchant = Object.values(data.enchants)[0]!;
    const modifier = Object.values(data.modifiers)[0]!;
    const gem = Object.values(data.gems)[0]!;

    expect(await findItemById(item.id)).toEqual(item);
    expect(await findEnchantById(enchant.id)).toEqual(enchant);
    expect(await findModifierById(modifier.id)).toEqual(modifier);
    expect(await findGemById(gem.id)).toEqual(gem);
  });

  test("returns null for unknown IDs", async () => {
    expect(await findItemById("missing-item")).toBeNull();
    expect(await findEnchantById("missing-enchant")).toBeNull();
    expect(await findModifierById("missing-modifier")).toBeNull();
    expect(await findGemById("missing-gem")).toBeNull();
  });
});

describe("find by name", () => {
  test("returns matching items, enchants, modifiers, and magics", async () => {
    const data = await getData();
    const item = Object.values(data.items)[0]!;
    const enchant = Object.values(data.enchants)[0]!;
    const modifier = Object.values(data.modifiers)[0]!;
    const magic = data.magics[0]!;

    expect(await findItemByName(item.name)).toEqual(item);
    expect(await findEnchantByName(enchant.name)).toEqual(enchant);
    expect(await findModifierByName(modifier.name)).toEqual(modifier);
    expect(await findMagicByName(magic.name)).toEqual(magic);
  });

  test("finds item names throughout the data set", async () => {
    const items = Object.values((await getData()).items);

    for (const item of [
      items[0]!,
      items[Math.floor(items.length / 2)]!,
      items.at(-1)!,
    ]) {
      expect(await findItemByName(item.name)).toEqual(item);
    }
  });

  test("matches names without regard to case", async () => {
    const data = await getData();
    const item = Object.values(data.items)[0]!;
    const enchant = Object.values(data.enchants)[0]!;
    const modifier = Object.values(data.modifiers)[0]!;
    const magic = data.magics[0]!;

    expect(await findItemByName(item.name.toLowerCase())).toEqual(item);
    expect(await findEnchantByName(enchant.name.toLowerCase())).toEqual(
      enchant
    );
    expect(await findModifierByName(modifier.name.toLowerCase())).toEqual(
      modifier
    );
    expect(await findMagicByName(magic.name.toLowerCase())).toEqual(magic);
  });

  test("returns null for unknown names", async () => {
    expect(await findItemByName("missing item")).toBeNull();
    expect(await findEnchantByName("missing enchant")).toBeNull();
    expect(await findModifierByName("missing modifier")).toBeNull();
    expect(await findMagicByName("missing magic")).toBeNull();
  });
});
