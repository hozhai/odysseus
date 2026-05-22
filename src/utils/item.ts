import type { APIMessageComponentEmoji } from "seyfert/lib/types";
import {
    COLOR_COMMON,
    COLOR_EXOTIC,
    COLOR_RARE,
    COLOR_UNCOMMON,
    EMPTY_CHESTPLATE_ID,
    EMPTY_ENCHANTMENT_ID,
    EMPTY_GEM_ID,
    EMPTY_MODIFIER_ID,
} from "../constants";
import { Item, Rarity, Slot } from "../types";
import { getData } from "../data/load";

/**
 * Get's the color of a rarity given the rarity.
 *
 * @param rarity A rarity that can be "Common", "Uncommon", "Rare", or "Exotic" (case-sensitive)
 * @returns {number} A hexadecimal number
 */
export function getRarityColor(rarity: Rarity): number {
    switch (rarity) {
        case "Common":
            return COLOR_COMMON;
        case "Uncommon":
            return COLOR_UNCOMMON;
        case "Rare":
            return COLOR_RARE;
        case "Exotic":
            return COLOR_EXOTIC;
    }
}

/**
 *
 * @param enchantItem
 * @returns { APIMessageComponentEmoji}
 */
export function itemEnchantToEmoji(
    enchantItem: Item
): APIMessageComponentEmoji | null {
    switch (enchantItem.name) {
        case "Deadeye":
            return { name: "agile", id: "1393732132588752946" };
        case "Brisk":
            return { name: "brisk", id: "1393732137315733564" };
        case "Enhanced":
            return { name: "enhanced", id: "1393732142772781076" };
        case "Amplified":
            return { name: "amplified", id: "1393732134249828422" };
        case "Powerful":
            return { name: "powerful", id: "1393732190595973180" };
        case "Hasty":
            return { name: "hasty", id: "1393732148699332718" };
        case "Strong":
            return { name: "strong", id: "1393732208673685615" };
        case "Nimble":
            return { name: "nimble", id: "1393732189136359656" };
        case "Hard":
            return { name: "hard", id: "1393732146514100334" };
        case "Bursting":
            return { name: "bursting", id: "1393732138754375801" };
        case "Healing":
            return { name: "healing", id: "1393732150288711690" };
        case "Piercing":
            return { name: "piercing", id: "1393732154491408507" };
        case "Charged":
            return { name: "charged", id: "1393732140533026846" };
        case "Explosive":
            return { name: "explosive", id: "1393732144869806151" };
        case "Armored":
            return { name: "armored", id: "1393732135604584489" };
        case "Virtuous":
            return { name: "virtuous", id: "1393732213480099940" };
        case "Swift":
            return { name: "swift", id: "1393732211379011624" };
        case "Resilience":
            return { name: "resilience", id: "1393732207155216404" };
        default:
            return null;
    }
}

export function itemModifierToEmoji(
    modifierItem: Item
): APIMessageComponentEmoji | null {
    switch (modifierItem.name) {
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

export function itemGemToEmoji(gemItem: Item): APIMessageComponentEmoji | null {
    switch (gemItem.name) {
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

export function textToEmoji(
    emojiText: string
): APIMessageComponentEmoji | null {
    if (emojiText === "" || !emojiText) {
        return null;
    }

    const name_and_id = emojiText
        .substring(1, emojiText.length - 1)
        .split(":")
        .slice(1);

    return { name: name_and_id[0], id: name_and_id[1] };
}

export async function emojiToGem(
    emoji: APIMessageComponentEmoji | null
): Promise<Item | null> {
    const itemsData = (await getData()).items;

    if (emoji == null) {
        return (
            Object.values(itemsData).filter(
                (val) => val.id === EMPTY_GEM_ID
            )[0] ?? null
        );
    }

    const gem = Object.values(itemsData)
        .filter((val) => val.mainType === "Gem")
        .filter((gem) => gem.name.toLowerCase() === emoji.name);

    if (gem.length == 0) {
        return null;
    }

    return gem[0] ?? null;
}

export async function emojiToEnchant(
    emoji: APIMessageComponentEmoji | null
): Promise<Item | null> {
    const itemsData = (await getData()).items;

    if (emoji == null) {
        return (
            Object.values(itemsData).filter(
                (val) => val.id === EMPTY_ENCHANTMENT_ID
            )[0] ?? null
        );
    }

    const enchant = Object.values(itemsData)
        .filter((val) => val.mainType === "Enchant")
        .filter((enchant) => enchant.name.toLowerCase() === emoji?.name);

    if (enchant.length == 0) {
        return null;
    }

    return enchant[0] ?? null;
}

export async function emojiToModifier(
    emoji: APIMessageComponentEmoji | null
): Promise<Item | null> {
    const itemsData = (await getData()).items;

    if (emoji == null) {
        return (
            Object.values(itemsData).filter(
                (val) => val.id === EMPTY_MODIFIER_ID
            )[0] ?? null
        );
    }

    const modifier = Object.values(itemsData)
        .filter((val) => val.mainType === "Modifier")
        .filter((modifier) => modifier.name.toLowerCase() === emoji.name);

    if (modifier.length == 0) {
        return null;
    }

    return modifier[0] ?? null;
}

export async function parseEmbedIntoSlot(
    embed: InMessageEmbed | null
): Promise<Slot> {
    const slot: Slot = {
        item_id: EMPTY_CHESTPLATE_ID,
        gem_ids: [],
        enchant_id: EMPTY_ENCHANTMENT_ID,
        modifier_id: EMPTY_MODIFIER_ID,
        level: 170,
    };

    if (!embed) {
        return slot;
    }

    const item_id = embed.title?.split(" | ")[1];
    const level = Number(
        embed.fields?.find((field) => field.name === "Level")?.value
    );
    const gemEmojis =
        embed.fields
            ?.find((field) => field.name === "Gems")
            ?.value.split(" ") ?? [];
    const enchantEmoji =
        embed.fields?.find((field) => field.name === "Enchant")?.value ?? "";
    const modifierEmoji =
        embed.fields?.find((field) => field.name === "Modifier")?.value ?? "";

    const gems = await Promise.all(
        gemEmojis.map(async (emojiText) => {
            const emoji = textToEmoji(emojiText);
            const gem = await emojiToGem(emoji);
            return gem?.id;
        })
    );

    const enchant = await emojiToEnchant(textToEmoji(enchantEmoji));

    const modifier = await emojiToModifier(textToEmoji(modifierEmoji));

    if (item_id) {
        slot.item_id = item_id;
    }

    if (gems.filter((id) => id !== undefined).length !== 0) {
        slot.gem_ids = gems.filter((id) => id !== undefined);
    }

    if (enchant?.id) {
        slot.enchant_id = enchant.id;
    }

    if (modifier?.id) {
        slot.modifier_id = modifier.id;
    }

    if (level) {
        slot.level = level;
    }

    return slot;
}

export async function findItemById(id: string): Promise<Item | null> {
    const itemData = (await getData()).items;
    const item = itemData[id];

    return item ?? null;
}
