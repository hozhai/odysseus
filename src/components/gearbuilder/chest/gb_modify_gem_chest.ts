import { EMPTY_CHESTPLATE_ID } from "@/constants";
import type { ComponentsV2Components } from "@/types/seyfert";
import {
  collectGemSearchResults,
  findItemById,
  parseGearbuilderComponentsIntoPlayer,
  serializeTopLevelComponent,
} from "@/utils";
import { ComponentCommand, ComponentContext } from "seyfert";

export default class GearbuilderModifyGemChestButton extends ComponentCommand {
  componentType = "Button" as const;

  override filter(ctx: ComponentContext<typeof this.componentType>) {
    return ctx.customId.startsWith("gb_modify_gem_chest_");
  }

  async run(ctx: ComponentContext<typeof this.componentType>) {
    const originalMessageId = ctx.customId.slice("gb_modify_gem_chest_".length);

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

    if (player.chestplate.itemId === EMPTY_CHESTPLATE_ID) {
      await ctx.update({
        content: "The Chestplate is empty, so it has no gems to modify.",
        components: [],
      });
      return;
    }

    const chestplateItem = await findItemById(player.chestplate.itemId);

    if (!chestplateItem) {
      await ctx.update({
        content: "The Chestplate item could not be found.",
        components: [],
      });
      return;
    }

    if (chestplateItem.gemNo === 0) {
      await ctx.update({
        content: "This Chestplate does not have any gem slots.",
        components: [],
      });
      return;
    }

    await ctx.update({
      content: `Gem 1/${chestplateItem.gemNo} for the Chestplate: Type your search query below...`,
      components: [],
    });

    collectGemSearchResults(
      ctx,
      responseMessage,
      originalMessageId,
      "chest",
      1,
      chestplateItem.gemNo
    );
  }
}
