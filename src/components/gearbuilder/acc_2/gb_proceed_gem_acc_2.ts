import { EMPTY_ACCESSORY_ID } from "@/constants";
import type { ComponentsV2Components } from "@/types/seyfert";
import {
  collectGemSearchResults,
  findGemById,
  findItemById,
  parseGearbuilderComponentsIntoPlayer,
  parsePlayerIntoGearbuilderComponents,
  serializeTopLevelComponent,
} from "@/utils";
import { ComponentCommand, ComponentContext, MessageFlags } from "seyfert";

export default class GearbuilderProceedGemAccessoryTwoButton extends ComponentCommand {
  componentType = "Button" as const;

  override filter(ctx: ComponentContext<typeof this.componentType>) {
    return ctx.customId.startsWith("gb_proceed_gem_acc_2_");
  }

  async run(ctx: ComponentContext<typeof this.componentType>) {
    const [originalMessageId, selectedGemId, gemIndexText] = ctx.customId
      .slice("gb_proceed_gem_acc_2_".length)
      .split("_");

    if (!originalMessageId) {
      await ctx.update({
        content: "Could not identify the original Gearbuilder message.",
        components: [],
      });
      return;
    }

    if (!selectedGemId) {
      await ctx.update({
        content: "Could not identify the selected gem.",
        components: [],
      });
      return;
    }

    const gemIndex = Number(gemIndexText);
    if (!Number.isInteger(gemIndex) || gemIndex < 1) {
      await ctx.update({
        content: "Could not identify the gem slot to update.",
        components: [],
      });
      return;
    }

    const responseMessage = ctx.message;
    const originalMessage = await ctx.client.messages.fetch(
      originalMessageId,
      ctx.channelId
    );

    const components: ComponentsV2Components = originalMessage.components.map(
      serializeTopLevelComponent
    );
    const player = await parseGearbuilderComponentsIntoPlayer(components);

    if (player.accessories[1].itemId === EMPTY_ACCESSORY_ID) {
      await ctx.update({
        content:
          "Error: Accessory Two item ID is of an empty accessory while running proceed gems.",
        components: [],
      });
      return;
    }

    const accessoryItem = await findItemById(player.accessories[1].itemId);

    if (!accessoryItem) {
      await ctx.update({
        content:
          "Error: Accessory Two item returned null while running proceed gems.",
        components: [],
      });
      return;
    }

    if (gemIndex > accessoryItem.gemNo) {
      await ctx.update({
        content: "The requested gem slot does not exist for this accessory.",
        components: [],
      });
      return;
    }

    const gem = await findGemById(selectedGemId);

    if (!gem) {
      await ctx.update({
        content: `The selected gem for slot #${gemIndex} was not found.`,
        components: [],
      });
      return;
    }

    player.accessories[1].gemIds[gemIndex - 1] = selectedGemId;

    const newComponents = await parsePlayerIntoGearbuilderComponents(
      player,
      ctx.author.username
    );

    await originalMessage.edit({
      components: [newComponents],
      flags: MessageFlags.IsComponentsV2,
    });

    if (gemIndex === accessoryItem.gemNo) {
      await ctx.update({
        content: "Finished setting gems.",
        components: [],
      });
      await ctx.deleteResponse();
      return;
    }

    const nextGemIndex = gemIndex + 1;

    await ctx.update({
      content: `Gem ${nextGemIndex}/${accessoryItem.gemNo} for Accessory Slot 2: Type your search query below...`,
      components: [],
    });

    collectGemSearchResults(
      ctx,
      responseMessage,
      originalMessageId,
      2,
      nextGemIndex,
      accessoryItem.gemNo
    );
  }
}
