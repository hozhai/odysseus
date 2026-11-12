import { EMPTY_ACCESSORY_ID } from "@/constants";
import type { ComponentsV2Components } from "@/types/seyfert";
import {
  collectGemSearchResults,
  findItemById,
  parseGearbuilderComponentsIntoPlayer,
  serializeTopLevelComponent,
} from "@/utils";
import { ComponentCommand, ComponentContext } from "seyfert";

export default class GearbuilderModifyGemAccessoryTwoButton extends ComponentCommand {
  componentType = "Button" as const;

  override filter(ctx: ComponentContext<typeof this.componentType>) {
    return ctx.customId.startsWith("gb_modify_gem_acc_2_");
  }

  async run(ctx: ComponentContext<typeof this.componentType>) {
    const originalMessageId = ctx.customId.slice("gb_modify_gem_acc_2_".length);

    if (!originalMessageId) {
      await ctx.update({
        content: "Could not identify the original Gearbuilder message.",
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
          "Error: Accessory Two item ID is of an empty accessory while running modify gems.",
        components: [],
      });
      return;
    }

    const accessoryItem = await findItemById(player.accessories[1].itemId);

    if (!accessoryItem) {
      await ctx.update({
        content:
          "Error: Accessory Two item returned null while running modify gems.",
        components: [],
      });
      return;
    }

    if (accessoryItem.gemNo === 0) {
      await ctx.update({
        content: "This accessory does not have any gem slots.",
        components: [],
      });
      return;
    }

    await ctx.update({
      content: `Gem 1/${accessoryItem.gemNo} for Accessory Slot 2: Type your search query below...`,
      components: [],
    });

    collectGemSearchResults(
      ctx,
      responseMessage,
      originalMessageId,
      2,
      1,
      accessoryItem.gemNo
    );
  }
}
