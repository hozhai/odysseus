import { EMPTY_PANTS_ID } from "@/constants";
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

export default class GearbuilderProceedGemPantsButton extends ComponentCommand {
  componentType = "Button" as const;

  override filter(ctx: ComponentContext<typeof this.componentType>) {
    return ctx.customId.startsWith("gb_proceed_gem_pants_");
  }

  async run(ctx: ComponentContext<typeof this.componentType>) {
    const [originalMessageId, selectedGemId, gemIndexText] = ctx.customId
      .slice("gb_proceed_gem_pants_".length)
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

    const gem = await findGemById(selectedGemId);

    if (!gem) {
      await ctx.update({
        content: `The selected gem for slot #${gemIndex} was not found.`,
        components: [],
      });
      return;
    }

    player.boots.gemIds[gemIndex - 1] = selectedGemId;

    const newComponents = await parsePlayerIntoGearbuilderComponents(
      player,
      ctx.author.username
    );

    await originalMessage.edit({
      components: [newComponents],
      flags: MessageFlags.IsComponentsV2,
    });

    if (gemIndex === pantsItem.gemNo) {
      await ctx.update({ content: "Finished setting gems.", components: [] });
      await ctx.deleteResponse();
      return;
    }

    const nextGemIndex = gemIndex + 1;

    await ctx.update({
      content: `Gem ${nextGemIndex}/${pantsItem.gemNo} for the Pants: Type your search query below...`,
      components: [],
    });

    collectGemSearchResults(
      ctx,
      responseMessage,
      originalMessageId,
      "pants",
      nextGemIndex,
      pantsItem.gemNo
    );
  }
}
