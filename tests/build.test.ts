import { describe, expect, test } from "bun:test";
import { unhashBuildCode } from "../src/utils/build";

describe("unhashBuildCode", () => {
  test("returns an empty player when no build code is provided", () => {
    const player = unhashBuildCode(undefined);

    expect(player.level).toBe(0);
    expect(player.magics).toEqual([]);
    expect(player.accessories).toHaveLength(0);
    expect(player.chestplate.item_id).toBeTruthy();
  });

  test("parses stats, magic/style indexes, and equipment slots", () => {
    const player = unhashBuildCode(
      "170,1,2,3,4|0,19|0,7|item-a,enchant-a,modifier-a,gem-a,170|,,,,170|,,,,170|,,,,170|,,,,170"
    );

    expect(player).toMatchObject({
      level: 170,
      vitalityPoints: 1,
      magicPoints: 2,
      strengthPoints: 3,
      weaponPoints: 4,
      magics: [0, 19],
      fightingStyles: [20, 27],
      chestplate: {
        item_id: "",
        gem_ids: [],
        level: 170,
      },
    });
    expect(player.accessories[0]).toMatchObject({
      item_id: "item-a",
      enchant_id: "enchant-a",
      modifier_id: "modifier-a",
      gem_ids: ["gem-a"],
      level: 170,
    });
  });

  test("rejects missing sections and malformed player stats", () => {
    expect(() => unhashBuildCode("170,1,2,3,4")).toThrow(
      "expected at least 8 sections"
    );
    expect(() => unhashBuildCode("170,1,nope,3,4|||||||")).toThrow(
      "Failed to parse magic points"
    );
  });

  test("rejects indexes outside supported ranges", () => {
    expect(() => unhashBuildCode("170,1,2,3,4|20||||||")).toThrow(
      "Invalid magic index: 20"
    );
    expect(() => unhashBuildCode("170,1,2,3,4||8|||||")).toThrow(
      "Invalid fighting style index: 8"
    );
  });

  test("rejects malformed equipment levels", () => {
    expect(() =>
      unhashBuildCode(
        "170,1,2,3,4|||,,,,170|,,,,170|,,,,170|,,,,170|item-a,enchant,modifier,,bad"
      )
    ).toThrow("Failed to parse item level");
  });
});
