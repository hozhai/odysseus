import {
  findEnchantsFromQuery,
  findGemsFromQuery,
  getGearbuilderSlotItemId,
  findItemById,
  findItemsFromQuery,
  parseGearbuilderComponentsIntoPlayer,
  serializeTopLevelComponent,
} from "@/utils";
import type { Player } from "@src-types";
import type { MainType } from "@data";
import {
  ActionRow,
  Button,
  ButtonStyle,
  ModalCommand,
  type ModalContext,
} from "seyfert";

const itemSearchSlots = [
  { id: "acc_1", label: "Accessory Slot 1", mainType: "Accessory" },
  { id: "acc_2", label: "Accessory Slot 2", mainType: "Accessory" },
  { id: "acc_3", label: "Accessory Slot 3", mainType: "Accessory" },
  { id: "chest", label: "Chestplate", mainType: "Chestplate" },
  { id: "pants", label: "Pants", mainType: "Pants" },
] as const satisfies readonly {
  id: string;
  label: string;
  mainType: MainType;
}[];

const searchTypes = ["item", "enchant", "gem"] as const;
const modalCustomIdPrefix = "gb_search_";

export default class GearbuilderSearchModal extends ModalCommand {
  override filter(ctx: ModalContext) {
    return ctx.customId.startsWith(modalCustomIdPrefix);
  }

  async run(ctx: ModalContext) {
    const searchType = searchTypes.find((type) =>
      ctx.customId.startsWith(`${modalCustomIdPrefix}${type}_`)
    );

    if (!searchType) {
      await ctx.write({
        content: "Could not identify the type of Gearbuilder search.",
        components: [],
      });
      return;
    }

    const slot = itemSearchSlots.find(({ id }) =>
      ctx.customId.startsWith(`${modalCustomIdPrefix}${searchType}_${id}_`)
    );

    if (!slot) {
      await ctx.write({
        content: "Could not identify the Gearbuilder slot to update.",
        components: [],
      });
      return;
    }

    const customIdPrefix = `${modalCustomIdPrefix}${searchType}_${slot.id}_`;
    const [originalMessageId, sourceMessageId, gemIndexText] = ctx.customId
      .slice(customIdPrefix.length)
      .split("_");

    if (!originalMessageId || !sourceMessageId) {
      await ctx.write({
        content:
          "Could not identify the original Gearbuilder message or search menu.",
        components: [],
      });
      return;
    }

    await ctx.client.messages.delete(sourceMessageId, ctx.channelId);

    let gemIndex: number | undefined;
    let gemCount: number | undefined;
    let player: Player | undefined;

    if (searchType === "gem") {
      const originalMessage = await ctx.client.messages.fetch(
        originalMessageId,
        ctx.channelId
      );
      const components = originalMessage.components.map(
        serializeTopLevelComponent
      );
      player = await parseGearbuilderComponentsIntoPlayer(components);
    }

    if (searchType === "gem") {
      gemIndex = Number(gemIndexText);
      if (!Number.isInteger(gemIndex) || gemIndex < 1 || !player) {
        await ctx.write({
          content: "Could not identify the gem slot to search.",
          components: [],
        });
        return;
      }

      const item = await findItemById(
        getGearbuilderSlotItemId(player, slot.id)
      );
      if (!item || gemIndex > item.gemNo) {
        await ctx.write({
          content: "The requested gem slot does not exist for this item.",
          components: [],
        });
        return;
      }
      gemCount = item.gemNo;
    }

    const query = ctx.getInputValue(`gb_search_${searchType}_query`, true);
    if (typeof query !== "string") {
      await ctx.write({
        content: "Could not read the search query.",
        components: [],
      });
      return;
    }

    let results: { id: string; name: string }[];

    switch (searchType) {
      case "item":
        results = await findItemsFromQuery(query, slot.mainType);
        break;
      case "enchant":
        results = await findEnchantsFromQuery(query);
        break;
      case "gem":
        results = await findGemsFromQuery(query);
        break;
    }

    if (results.length === 0) {
      const retryCustomId =
        searchType === "gem"
          ? `gb_retry_gem_${slot.id}_${originalMessageId}_${gemIndex}`
          : `gb_modify_${searchType}_${slot.id}_${originalMessageId}`;
      const retryButton = new Button()
        .setLabel(
          searchType === "gem"
            ? `Try another search for Gem ${gemIndex}/${gemCount}`
            : "Try another search"
        )
        .setCustomId(retryCustomId)
        .setStyle(ButtonStyle.Primary);

      await ctx.write({
        content: `You searched for \`${query}\`. No ${searchType} matched your query - please try again.`,
        components: [new ActionRow().addComponents(retryButton)],
      });
      return;
    }

    const resultButtons = results.map((result, index) =>
      new Button()
        .setLabel(`#${index + 1}`)
        .setCustomId(
          searchType === "gem"
            ? `gb_proceed_gem_${slot.id}_${originalMessageId}_${result.id}_${gemIndex}`
            : `gb_select_${searchType}_${slot.id}_${result.id}_${originalMessageId}`
        )
        .setStyle(ButtonStyle.Secondary)
    );

    await ctx.write({
      content: `You searched for \`${query}\`. Select a result:\n${results
        .map((result, index) => `#${index + 1} - ${result.name}`)
        .join("\n")}`,
      components: [new ActionRow().addComponents(...resultButtons)],
    });
  }
}
