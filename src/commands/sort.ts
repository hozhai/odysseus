import {
  Command,
  type CommandContext,
  createStringOption,
  Declare,
  Embed,
  Options,
} from "seyfert";
import { getData } from "../data/load";
import { EMBED_COLOR_DEFAULT, EMBED_FOOTER } from "../constants";
import type { Item, TotalStats } from "../types";
import { calculateItemStats } from "../utils";
import { createPagination } from "../utils/pagination";

const statChoices = [
  { name: "Power", value: "power" },
  { name: "Defense", value: "defense" },
  { name: "Agility", value: "agility" },
  { name: "Attack Speed", value: "attackSpeed" },
  { name: "Attack Size", value: "attackSize" },
  { name: "Intensity", value: "intensity" },
  { name: "Regeneration", value: "regeneration" },
  { name: "Piercing", value: "piercing" },
  { name: "Resistance", value: "resistance" },
  { name: "Warding", value: "warding" },
  { name: "Drawback", value: "drawback" },
] as const satisfies readonly { name: string; value: keyof TotalStats }[];

const pieceChoices = [
  { name: "Accessory", value: "Accessory" },
  { name: "Chestplate", value: "Chestplate" },
  { name: "Pants", value: "Pants" },
] as const;

const options = {
  stat: createStringOption({
    description: "Choose the stat to sort items by.",
    required: true,
    choices: statChoices,
  }),
  piece: createStringOption({
    description: "Optionally filter by item piece.",
    required: false,
    choices: pieceChoices,
  }),
};

@Declare({
  name: "sort",
  description: "Sorts items by a stat, optionally filtering by piece type.",
})
@Options(options)
export default class SortCommand extends Command {
  override async run(ctx: CommandContext<typeof options>) {
    const stat = ctx.options.stat as keyof TotalStats;
    const statLabel =
      statChoices.find((choice) => choice.value === stat)?.name ?? stat;
    const piece = ctx.options.piece;
    const items = Object.values((await getData()).items)
      .filter((item) => !piece || item.mainType === piece)
      .map((item) => ({ item, value: calculateItemStats(item)[stat] }))
      .filter(({ value }) => value !== 0)
      .sort(
        (left, right) =>
          right.value - left.value ||
          left.item.name.localeCompare(right.item.name)
      );

    if (!items.length) {
      await ctx.write({
        content: `No ${piece ? `${piece} ` : ""}items have the ${statLabel} stat.`,
      });
      return;
    }

    const entriesPerPage = 10;
    const pages: Embed[] = [];

    for (let start = 0; start < items.length; start += entriesPerPage) {
      const pageItems = items.slice(start, start + entriesPerPage);
      const pageNumber = pages.length + 1;

      const pieceLabel =
        piece === "Accessory"
          ? "Accesories"
          : piece === "Chestplate"
            ? "Chestplates"
            : piece === "Pants"
              ? piece
              : "Items";

      pages.push(
        new Embed()
          .setAuthor({
            name: ctx.author.username,
            iconUrl: ctx.author.avatarURL(),
          })
          .setTitle(`${pieceLabel} Sorted by ${statLabel}`)
          .setColor(EMBED_COLOR_DEFAULT)
          .setFields(
            pageItems.map(({ item, value }, index) => ({
              name: `#${start + index + 1} ${item.name}`,
              value: formatItemValue(item, value, statLabel),
            }))
          )
          .setFooter({
            text: `${EMBED_FOOTER} | Page ${pageNumber}`,
          })
      );
    }

    await createPagination({ ctx, pages });
  }
}

function formatItemValue(item: Item, value: number, statLabel: string): string {
  const formattedValue =
    value > 0 ? `+${value}` : value.toLocaleString("en-US");
  return `${formattedValue} ${statLabel} | ${item.mainType} | ${item.rarity}`;
}
