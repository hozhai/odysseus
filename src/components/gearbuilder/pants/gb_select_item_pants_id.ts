import { ComponentCommand, ComponentContext, MessageFlags } from "seyfert";
import {
  parseGearbuilderComponentsIntoPlayer,
  parsePlayerIntoGearbuilderComponents,
  serializeTopLevelComponent,
} from "@/utils";
import type { ComponentsV2Components } from "@/types/seyfert";
import { EMPTY_ENCHANTMENT_ID, EMPTY_MODIFIER_ID } from "@/constants";

export default class GearbuilderSelectItemPantsButton extends ComponentCommand {
  componentType = "Button" as const;

  override filter(ctx: ComponentContext<typeof this.componentType>) {
    return ctx.customId.startsWith("gb_select_item_pants_");
  }

  async run(ctx: ComponentContext<typeof this.componentType>) {
    const [itemId, originalMessageId] = ctx.customId
      .slice("gb_select_item_pants_".length)
      .split("_");

    if (!itemId || !originalMessageId) {
      await ctx.update({
        content:
          "Could not identify the selected item or original Gearbuilder message.",
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

    player.boots.itemId = itemId;
    player.boots.enchantId = EMPTY_ENCHANTMENT_ID;
    player.boots.modifierId = EMPTY_MODIFIER_ID;
    player.boots.gemIds = [];

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
