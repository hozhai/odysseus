import { ComponentCommand, ComponentContext, MessageFlags } from "seyfert";
import {
  parseGearbuilderComponentsIntoPlayer,
  parsePlayerIntoGearbuilderComponents,
  serializeTopLevelComponent,
} from "@/utils";
import type { ComponentsV2Components } from "@/types/seyfert";
import { EMPTY_ENCHANTMENT_ID, EMPTY_MODIFIER_ID } from "@/constants";

export default class GearbuilderSelectItemAccessoryThreeButton extends ComponentCommand {
  componentType = "Button" as const;

  override filter(ctx: ComponentContext<typeof this.componentType>) {
    return ctx.customId.startsWith("gb_select_item_acc_3_");
  }

  async run(ctx: ComponentContext<typeof this.componentType>) {
    const [itemId, originalMessageId] = ctx.customId
      .slice("gb_select_item_acc_3_".length)
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
    const newPlayer = { ...player };

    newPlayer.accessories[2].itemId = itemId;
    newPlayer.accessories[2].enchantId = EMPTY_ENCHANTMENT_ID;
    newPlayer.accessories[2].modifierId = EMPTY_MODIFIER_ID;
    newPlayer.accessories[2].gemIds = [];

    const newComponents = await parsePlayerIntoGearbuilderComponents(
      newPlayer,
      ctx.author.username
    );

    await originalMessage.edit({
      components: [newComponents],
      flags: MessageFlags.IsComponentsV2,
    });

    await ctx.update({
      content: `Selected.`,
      components: [],
    });

    await ctx.deleteResponse();
  }
}
