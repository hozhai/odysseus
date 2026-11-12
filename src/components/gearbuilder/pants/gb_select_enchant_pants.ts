import { ComponentCommand, ComponentContext, MessageFlags } from "seyfert";
import {
  findItemById,
  parseGearbuilderComponentsIntoPlayer,
  parsePlayerIntoGearbuilderComponents,
  serializeTopLevelComponent,
} from "@/utils";
import type { ComponentsV2Components } from "@/types/seyfert";

export default class GearbuilderSelectEnchantPantsButton extends ComponentCommand {
  componentType = "Button" as const;

  override filter(ctx: ComponentContext<typeof this.componentType>) {
    return ctx.customId.startsWith("gb_select_enchant_pants_");
  }

  async run(ctx: ComponentContext<typeof this.componentType>) {
    const [enchantId, originalMessageId] = ctx.customId
      .slice("gb_select_enchant_pants_".length)
      .split("_");

    if (!enchantId || !originalMessageId) {
      await ctx.update({
        content:
          "Could not identify the selected enchant or original Gearbuilder message.",
        components: [],
      });
      return;
    }

    const originalMessage = await ctx.client.messages.fetch(
      originalMessageId,
      ctx.channelId
    );
    const components: ComponentsV2Components = originalMessage.components.map(
      serializeTopLevelComponent
    );
    const player = await parseGearbuilderComponentsIntoPlayer(components);
    const item = await findItemById(player.boots.itemId);

    if (!item) {
      await ctx.update({
        content:
          "The affected slot's item was not found. Please contact the developer and try again.",
        components: [],
      });
      return;
    }

    player.boots.enchantId = enchantId;

    const newComponents = await parsePlayerIntoGearbuilderComponents(
      player,
      ctx.author.username
    );

    await originalMessage.edit({
      components: [newComponents],
      flags: MessageFlags.IsComponentsV2,
    });

    await ctx.update({ content: "Selected.", components: [] });
    await ctx.deleteResponse();
  }
}
