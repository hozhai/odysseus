import { EMPTY_CHESTPLATE_ID } from "@/constants";
import type { ComponentsV2Components } from "@/types/seyfert";
import {
  collectGemSearchResults,
  findItemById,
  parseGearbuilderComponentsIntoPlayer,
  serializeTopLevelComponent,
} from "@/utils";
import { ComponentCommand, ComponentContext } from "seyfert";

export default class GearbuilderRetryGemChestButton extends ComponentCommand {
  componentType = "Button" as const;

  override filter(ctx: ComponentContext<typeof this.componentType>) {
    return ctx.customId.startsWith("gb_retry_gem_chest_");
  }

  async run(ctx: ComponentContext<typeof this.componentType>) {
    const [originalMessageId, gemIndexText] = ctx.customId
      .slice("gb_retry_gem_chest_".length)
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

    if (gemIndex > chestplateItem.gemNo) {
      await ctx.update({
        content: "The requested gem slot does not exist on the Chestplate.",
        components: [],
      });
      return;
    }

    await ctx.update({
      content: `Gem ${gemIndex}/${chestplateItem.gemNo} for the Chestplate: Type your search query below...`,
      components: [],
    });

    collectGemSearchResults(
      ctx,
      responseMessage,
      originalMessageId,
      "chest",
      gemIndex,
      chestplateItem.gemNo
    );
  }
}
