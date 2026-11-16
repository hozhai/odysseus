import { findItemById, findModifierById } from "@/utils";
import {
  getGearbuilderSlotItemId,
  parseGearbuilderComponentsIntoPlayer,
  parsePlayerIntoGearbuilderComponents,
  serializeTopLevelComponent,
  type GearbuilderSlotId,
} from "@/utils";
import type { ComponentsV2Components } from "@/types/seyfert";
import { ComponentCommand, ComponentContext, MessageFlags } from "seyfert";

const slotIds: GearbuilderSlotId[] = [
  "acc_1",
  "acc_2",
  "acc_3",
  "chest",
  "pants",
];
const customIdPrefix = "gb_select_modifier_";

export default class GearbuilderSelectModifierMenu extends ComponentCommand {
  componentType = "StringSelect" as const;

  override filter(ctx: ComponentContext<typeof this.componentType>) {
    return ctx.customId.startsWith(customIdPrefix);
  }

  async run(ctx: ComponentContext<typeof this.componentType>) {
    const slotId = slotIds.find((id) =>
      ctx.customId.startsWith(`${customIdPrefix}${id}_`)
    );

    if (!slotId) {
      await ctx.update({
        content: "Could not identify the Gearbuilder slot to update.",
        components: [],
      });
      return;
    }

    const originalMessageId = ctx.customId.slice(
      `${customIdPrefix}${slotId}_`.length
    );
    const modifierId = ctx.interaction.data.values[0];

    if (!originalMessageId || !modifierId) {
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

    const [item, modifier] = await Promise.all([
      findItemById(getGearbuilderSlotItemId(player, slotId)),
      findModifierById(modifierId),
    ]);

    if (!item || !modifier || !item.validModifiers.includes(modifier.name)) {
      await ctx.update({
        content:
          "The selected modifier is no longer valid for this item's slot.",
        components: [],
      });
      return;
    }

    switch (slotId) {
      case "acc_1":
        player.accessories[0].modifierId = modifier.id;
        break;
      case "acc_2":
        player.accessories[1].modifierId = modifier.id;
        break;
      case "acc_3":
        player.accessories[2].modifierId = modifier.id;
        break;
      case "chest":
        player.chestplate.modifierId = modifier.id;
        break;
      case "pants":
        player.boots.modifierId = modifier.id;
        break;
    }

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
