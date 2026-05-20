```ts
function emojiToString(emoji: APIMessageComponentEmoji | null): string | null {
  if (!emoji?.name || !emoji.id) {
    return null;
  }

  return `<:${emoji.name}:${emoji.id}>`;
}

function extractCustomEmoji(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  const match = value.match(/<:[a-zA-Z0-9_]+:\d+>/);
  return match?.[0] ?? null;
}

async function findItemByEmoji(
  emojiValue: string | null | undefined,
  itemType: string,
  emojiFactory: (item: Item) => APIMessageComponentEmoji | null,
): Promise<Item | null> {
  const targetEmoji = extractCustomEmoji(emojiValue);
  if (!targetEmoji) {
    return null;
  }

  const data = await getData();

  return (
    Object.values(data.items).find((item) => {
      if (item.mainType !== itemType) {
        return false;
      }

      const emoji = emojiToString(emojiFactory(item));
      return emoji === targetEmoji;
    }) ?? null
  );
}

export async function emojiToEnchant(
  emojiValue: string | null | undefined,
): Promise<Item | null> {
  return findItemByEmoji(emojiValue, "Enchant", (item) =>
    itemEnchantToEmoji(item.name),
  );
}

export async function emojiToModifier(
  emojiValue: string | null | undefined,
): Promise<Item | null> {
  return findItemByEmoji(emojiValue, "Modifier", (item) =>
    itemModifierToEmoji(item.name),
  );
}

export async function emojiToGem(
  emojiValue: string | null | undefined,
): Promise<Item | null> {
  return findItemByEmoji(emojiValue, "Gem", itemGemToEmoji);
}

export function itemModifierToEmoji(
  modifierItem: Item,
): APIMessageComponentEmoji | null {
  switch (modifierItem) {
    case "Abyssal":
      return { name: "abyssal", id: "1393733751279718591" };
    case "Archaic":
      return { name: "archaic", id: "1393733752877744178" };
    case "Atlantean Essence":
      return { name: "atlantean", id: "1393733755088404665" };
    case "Blasted":
      return { name: "blasted", id: "1393733757537882144" };
    case "Crystalline":
      return { name: "crystalline", id: "1393733759114936443" };
    case "Drowned":
      return { name: "drowned", id: "1393733760670896128" };
    case "Frozen":
      return { name: "frozen", id: "1393733762541682870" };
    case "Sandy":
      return { name: "sandy", id: "1393733763938386000" };
    case "Superheated":
      return { name: "superheated", id: "1393733766517887006" };
    default:
      return null;
  }
}

export function itemGemToEmoji(item: Item): APIMessageComponentEmoji | null {
  switch (item.name) {
    case "Defense Gem":
      return { name: "defensegem", id: "1393733031927349268" };
    case "Power Gem":
      return { name: "powergem", id: "1393733189289115710" };
    case "Attack Speed Gem":
      return { name: "attackspeedgem", id: "1393733075699105943" };
    case "Attack Size Gem":
      return { name: "attacksizegem", id: "1393733045210845336" };
    case "Agility Gem":
      return { name: "agilitygem", id: "1393733033659469926" };
    case "Intensity Gem":
      return { name: "intensitygem", id: "1393733041079324734" };
    case "Lapiz Lazuli":
      return { name: "lapislazuli", id: "1393733050508251177" };
    case "Larimar":
      return { name: "larimar", id: "1393733187091435520" };
    case "Agate":
      return { name: "agate", id: "1393733030019076177" };
    case "Malachite":
      return { name: "malachite", id: "1393733054895231077" };
    case "Candelaria":
      return { name: "candelaria", id: "1393733039049408657" };
    case "Morenci":
      return { name: "morenci", id: "1393733059039465562" };
    case "Painite":
      return { name: "painite", id: "1393733069969817762" };
    case "Kyanite":
      return { name: "kyanite", id: "1393733049115611136" };
    case "Variscite":
      return { name: "variscite", id: "1393733193798123560" };
    case "Perfect Azurite":
      return { name: "azurite", id: "1393733037447184394" };
    case "Perfect Aventurine":
      return { name: "aventurine", id: "1393733035450699910" };
    case "Perfect Fire Opal":
      return { name: "fireopal", id: "1393733046792093837" };
    default:
      return null;
  }
}

export async function parseEmbedIntoItem(embed: InMessageEmbed): Promise<Slot> {
  const item_id = embed.title?.split(" | ")[1];
  const gemField = embed.fields?.find((field) => field.name === "Gems")?.value;
  const enchantField = embed.fields?.find(
    (field) => field.name === "Enchantment" || field.name === "Enchant",
  )?.value;
  const modifierField = embed.fields?.find(
    (field) => field.name === "Modifier",
  )?.value;
  const levelField = embed.fields?.find(
    (field) => field.name === "Level",
  )?.value;

  const slot: Slot = {
    item_id: EMPTY_CHESTPLATE_ID,
    gems_id: [],
    enchant_id: EMPTY_ENCHANTMENT_ID,
    modifier_id: EMPTY_MODIFIER_ID,
    level: 170,
  };

  slot.item_id = item_id ?? EMPTY_CHESTPLATE_ID;

  if (levelField) {
    const parsedLevel = Number.parseInt(levelField, 10);
    if (!Number.isNaN(parsedLevel)) {
      slot.level = parsedLevel;
    }
  }

  const enchant = await emojiToEnchant(enchantField);
  if (enchant) {
    slot.enchant_id = enchant.id;
  }

  const modifier = await emojiToModifier(modifierField);
  if (modifier) {
    slot.modifier_id = modifier.id;
  }

  if (gemField) {
    const gemLines = gemField
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && line !== "Empty Slot");

    for (const gemLine of gemLines) {
      const gem = await emojiToGem(gemLine);
      if (gem) {
        slot.gems_id.push(gem.id);
      }
    }
  }

  return slot;
}
```
