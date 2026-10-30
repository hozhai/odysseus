import { describe, expect, test } from "bun:test";
import type { BotData } from "../src/data/schemas";
import { ItemsSchema } from "../src/data/schemas";
import { getData } from "../src/data/loadData";
import { validateData } from "../src/data/validate";

function createValidData(): BotData {
  return {
    items: {
      item1: {
        id: "item1",
        name: "Item",
        legend: "",
        mainType: "Accessory",
        rarity: "Common",
        imageId: "",
        deleted: false,
        validModifiers: ["Modifier"],
      },
    },
    weapons: [],
    magics: [
      {
        name: "Magic",
        legend: "",
        imageId: "",
        unimbued: { damage: 1, speed: 1, size: 1 },
        imbued: { damage: 1, speed: 1, size: { conjurer: 1, warlock: 1 } },
        specialEffect: "",
        clash: { over: ["Magic"], neutral: [], under: [] },
      },
    ],
    modifiers: {
      modifier1: {
        id: "modifier1",
        name: "Modifier",
        legend: "",
        mainType: "Modifier",
        rarity: "Common",
        imageId: "",
        deleted: false,
      },
    },
    enchants: {},
    gems: {},
  };
}

describe("YAML data validation", () => {
  test("accepts a correctly shaped record and BotData", () => {
    expect(
      ItemsSchema.safeParse({
        item1: {
          id: "item1",
          name: "Item",
          legend: "",
          mainType: "Accessory",
          rarity: "Common",
          imageId: "",
          deleted: false,
        },
      }).success
    ).toBe(true);

    expect(() => validateData(createValidData())).not.toThrow();
  });

  test("rejects malformed records with field-path issues", () => {
    const result = ItemsSchema.safeParse({
      item1: { id: "item1", name: 7 },
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.map((issue) => issue.path.join("."))
      ).toContain("item1.name");
    }
  });

  test("reports map-key and cross-file reference mismatches", () => {
    const data = createValidData();
    data.items.item1!.id = "different-id";
    data.items.item1!.validModifiers = ["Missing Modifier"];
    data.magics[0]!.clash.over.push("Missing Magic");

    expect(() => validateData(data)).toThrow(
      /items\.item1\.id: does not match map key/
    );
    expect(() => validateData(data)).toThrow(
      /items\.item1\.validModifiers: unknown modifier/
    );
    expect(() => validateData(data)).toThrow(
      /magics\.Magic\.clash\.over: unknown magic/
    );
  });

  test("loads and validates the project's real YAML data", async () => {
    const data = await getData();
    expect(Object.keys(data.items).length).toBeGreaterThan(0);
    expect(data.magics.length).toBeGreaterThan(0);
  });
});
