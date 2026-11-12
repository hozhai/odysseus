import { EMPTY_ACCESSORY_ID } from "@/constants";
import type { ComponentsV2Components } from "@/types/seyfert";
import {
  collectGemSearchResults,
  findItemById,
  parseGearbuilderComponentsIntoPlayer,
  serializeTopLevelComponent,
} from "@/utils";
import { ComponentCommand, ComponentContext } from "seyfert";

export default class GearbuilderRetryGemAccessoryTwoButton extends ComponentCommand {
  componentType = "Button" as const;

  override filter(ctx: ComponentContext<typeof this.componentType>) {
    return ctx.customId.startsWith("gb_retry_gem_acc_2_");
  }

  async run(ctx: ComponentContext<typeof this.componentType>) {
    const [originalMessageId, gemIndexText] = ctx.customId
      .slice("gb_retry_gem_acc_2_".length)
      .split("_");

    if (!originalMessageId) {
      await ctx.update({
        content: "Could not identify the original Gearbuilder message.",
        components: [],
      });
      return;
    }

    const gemIndex = Number(gemIndexText);
    if (!Number.isInteger(gemIndex) || gemIndex < 1) {
      await ctx.update({
        content: "Could not identify the gem slot to retry.",
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
          "Error: Accessory Two item ID is of an empty accessory while running retry gems.",
        components: [],
      });
      return;
    }

    const accessoryItem = await findItemById(player.accessories[1].itemId);

    if (!accessoryItem) {
      await ctx.update({
        content:
          "Error: Accessory Two item returned null while running retry gems.",
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

    await ctx.update({
      content: `Gem ${gemIndex}/${accessoryItem.gemNo} for Accessory Slot 2: Type your search query below...`,
      components: [],
    });

    collectGemSearchResults(
      ctx,
      responseMessage,
      originalMessageId,
      2,
      gemIndex,
      accessoryItem.gemNo
    );
  }
}
