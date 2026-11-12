import { ComponentCommand, ComponentContext, MessageFlags } from "seyfert";
import {
  parseGearbuilderComponentsIntoPlayer,
  parsePlayerIntoGearbuilderComponents,
  serializeTopLevelComponent,
} from "@/utils";
import type { ComponentsV2Components } from "@/types/seyfert";

export default class GearbuilderSelectModifierAccessoryThreeButton extends ComponentCommand {
  componentType = "Button" as const;

  override filter(ctx: ComponentContext<typeof this.componentType>) {
    return ctx.customId.startsWith("gb_select_modifier_acc_3_");
  }

  async run(ctx: ComponentContext<typeof this.componentType>) {
    const [modifierId, originalMessageId] = ctx.customId
      .slice("gb_select_modifier_acc_3_".length)
      .split("_");

    if (!modifierId || !originalMessageId) {
      await ctx.update({
        content:
          "Could not identify the selected modifier or original Gearbuilder message.",
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
    newPlayer.accessories[2].modifierId = modifierId;

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
