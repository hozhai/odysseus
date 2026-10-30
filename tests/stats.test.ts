import { describe, expect, test } from "bun:test";
import { MAX_LEVEL } from "../src/constants";
import { getData } from "../src/data/loadData";
import { ItemSchema } from "../src/data/schemas";
import {
  calculateGemStats,
  calculateItemStats,
  detectImbue,
  formatTotalStats,
  getImbuePieceMultiplier,
  getImbueStatMultiplier,
} from "../src/utils/stats";

describe("item stat helpers", () => {
  test("returns zero stats for a missing item", () => {
    expect(calculateItemStats(null)).toEqual({
      power: 0,
      defense: 0,
      agility: 0,
      attackSpeed: 0,
      attackSize: 0,
      intensity: 0,
      regeneration: 0,
      insanity: 0,
      piercing: 0,
      resistance: 0,
      warding: 0,
      drawback: 0,
    });
  });

  test("scales base stats and preserves flat warding/drawback values", () => {
    const item = ItemSchema.parse({
      id: "test-item",
      name: "Test Item",
      legend: "",
      mainType: "Accessory",
      rarity: "Common",
      imageId: "",
      deleted: false,
      scaling: {
        power: 1,
        warding: 2,
        drawback: 3,
      },
    });

    const stats = calculateItemStats(item);

    expect(stats.power).toBe(Math.floor(MAX_LEVEL * 0.315 * 10) / 10);
    expect(stats.warding).toBe(2);
    expect(stats.drawback).toBe(3);
  });

  test("adds gem stats and ignores unknown gem IDs", async () => {
    const stats = await calculateGemStats(["aZ2", "qGg", "missing"]);

    expect(stats.intensity).toBe(10);
    expect(stats.defense).toBe(31);
    expect(stats.power).toBe(0);
  });

  test("the gem IDs used in the stat test exist in the loaded data", async () => {
    const data = await getData();
    expect(data.gems.aZ2?.name).toBe("Intensity Gem");
    expect(data.gems.qGg?.name).toBe("Defense Gem");
  });

  test("detects imbues by item name and respects piece type", () => {
    const weapon = ItemSchema.parse({
      id: "weapon",
      name: "Lightning Spear",
      legend: "",
      mainType: "Weapon",
      rarity: "Common",
      imageId: "",
      deleted: false,
    });
    const chestplate = {
      ...weapon,
      name: "Basic Combat Chestplate",
      mainType: "Chestplate",
    };

    expect(detectImbue(weapon)).toBe("lightning");
    expect(detectImbue(chestplate)).toBe("basic");
    expect(getImbuePieceMultiplier(chestplate)).toBe(1);
    expect(getImbuePieceMultiplier(weapon)).toBe(0.75);
    expect(getImbueStatMultiplier("fire", "power")).toBe(1);
    expect(getImbueStatMultiplier("fire", "defense")).toBe(0);
  });

  test("formats empty stats and omits zero-valued stats", () => {
    const empty = calculateItemStats(null);
    expect(formatTotalStats(empty)).toBe("No stats");

    const formatted = formatTotalStats({ ...empty, power: 5, warding: 1 });
    expect(formatted).toContain(" 5");
    expect(formatted).toContain(" 1");
    expect(formatted.split("\n")).toHaveLength(2);
  });
});
