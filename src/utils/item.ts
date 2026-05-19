import {
  COLOR_COMMON,
  COLOR_EXOTIC,
  COLOR_RARE,
  COLOR_UNCOMMON,
} from "../constants";
import { Rarity } from "../types";

export function getRarityColor(rarity: Rarity) {
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
