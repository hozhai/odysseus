import { EMPTY_PANTS_ID } from "@/constants";
import type { ComponentsV2Components } from "@/types/seyfert";
import {
  collectGemSearchResults,
  findItemById,
  parseGearbuilderComponentsIntoPlayer,
  serializeTopLevelComponent,
} from "@/utils";
import { ComponentCommand, ComponentContext } from "seyfert";

export default class GearbuilderRetryGemPantsButton extends ComponentCommand {
  componentType = "Button" as const;

  override filter(ctx: ComponentContext<typeof this.componentType>) {
    return ctx.customId.startsWith("gb_retry_gem_pants_");
  }

  async run(ctx: ComponentContext<typeof this.componentType>) {
    const [originalMessageId, gemIndexText] = ctx.customId
      .slice("gb_retry_gem_pants_".length)
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

    if (player.boots.itemId === EMPTY_PANTS_ID) {
      await ctx.update({
        content: "The Pants slot is empty, so it has no gems to modify.",
        components: [],
      });
      return;
    }

    const pantsItem = await findItemById(player.boots.itemId);

    if (!pantsItem) {
      await ctx.update({
        content: "The Pants item could not be found.",
        components: [],
      });
      return;
    }

    if (gemIndex > pantsItem.gemNo) {
      await ctx.update({
        content: "The requested gem slot does not exist on the Pants.",
        components: [],
      });
      return;
    }

    await ctx.update({
      content: `Gem ${gemIndex}/${pantsItem.gemNo} for the Pants: Type your search query below...`,
      components: [],
    });

    collectGemSearchResults(
      ctx,
      responseMessage,
      originalMessageId,
      "pants",
      gemIndex,
      pantsItem.gemNo
    );
  }
}
