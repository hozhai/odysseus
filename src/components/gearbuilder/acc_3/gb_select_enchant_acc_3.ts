import { ComponentCommand, ComponentContext, MessageFlags } from "seyfert";
import {
  findItemById,
  parseGearbuilderComponentsIntoPlayer,
  parsePlayerIntoGearbuilderComponents,
  serializeTopLevelComponent,
} from "@/utils";
import type { ComponentsV2Components } from "@/types/seyfert";

export default class GearbuilderSelectEnchantAccessoryThreeButton extends ComponentCommand {
  componentType = "Button" as const;

  override filter(ctx: ComponentContext<typeof this.componentType>) {
    return ctx.customId.startsWith("gb_select_enchant_acc_3_");
  }

  async run(ctx: ComponentContext<typeof this.componentType>) {
    const [enchantId, originalMessageId] = ctx.customId
      .slice("gb_select_enchant_acc_3_".length)
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
    const item = await findItemById(player.accessories[2].itemId);

    if (!item) {
      await ctx.update({
        content:
          "The affected slot's item was not found. Please contact the developer and try again.",
        components: [],
      });
      return;
    }

    const newPlayer = { ...player };
    newPlayer.accessories[2].enchantId = enchantId;

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
