import { describe, expect, test } from "bun:test";
import {
  FightingStylesEnum,
  fsNameToEnum,
  magicNameToEnum,
  MagicsEnum,
  unhashBuildCode,
} from "@utils";

describe("name to enum mappings", () => {
  test("maps magic names to their enum values", () => {
    const mappings = [
      ["Acid", MagicsEnum.Acid],
      ["Ash", MagicsEnum.Ash],
      ["Crystal", MagicsEnum.Crystal],
      ["Earth", MagicsEnum.Earth],
      ["Explosion", MagicsEnum.Explosion],
      ["Fire", MagicsEnum.Fire],
      ["Glass", MagicsEnum.Glass],
      ["Ice", MagicsEnum.Ice],
      ["Light", MagicsEnum.Light],
      ["Lightning", MagicsEnum.Lightning],
      ["Magma", MagicsEnum.Magma],
      ["Metal", MagicsEnum.Metal],
      ["Plasma", MagicsEnum.Plasma],
      ["Poison", MagicsEnum.Poison],
      ["Sand", MagicsEnum.Sand],
      ["Shadow", MagicsEnum.Shadow],
      ["Snow", MagicsEnum.Snow],
      ["Water", MagicsEnum.Water],
      ["Wind", MagicsEnum.Wind],
      ["Wood", MagicsEnum.Wood],
    ] as const;

    for (const [name, value] of mappings) {
      expect(magicNameToEnum(name)).toBe(value);
    }

    expect(magicNameToEnum("unknown")).toBeNull();
  });

  test("maps fighting style names to their enum values", () => {
    const mappings = [
      ["Basic Combat", FightingStylesEnum.BasicCombat],
      ["Boxing", FightingStylesEnum.Boxing],
      ["Iron Leg", FightingStylesEnum.IronLeg],
      ["Cannon Fist", FightingStylesEnum.CannonFist],
      ["Powder Fist", FightingStylesEnum.PowderFist],
      ["Sailor Style", FightingStylesEnum.SailorStyle],
      ["Thermo Fist", FightingStylesEnum.ThermoFist],
      ["Vanishing Style", FightingStylesEnum.VanishingStyle],
    ] as const;

    for (const [name, value] of mappings) {
      expect(fsNameToEnum(name)).toBe(value);
    }

    expect(fsNameToEnum("unknown")).toBeNull();
  });
});

describe("unhashBuildCode", () => {
  test("returns an empty player when no build code is provided", () => {
    const player = unhashBuildCode(undefined);

    expect(player.level).toBe(0);
    expect(player.magics).toEqual([]);
    expect(player.accessories).toHaveLength(0);
    expect(player.chestplate.itemId).toBeTruthy();
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
        itemId: "",
        gemIds: [],
        level: 170,
      },
    });
    expect(player.accessories[0]).toMatchObject({
      itemId: "item-a",
      enchantId: "enchant-a",
      modifierId: "modifier-a",
      gemIds: ["gem-a"],
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
