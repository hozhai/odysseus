import { EMPTY_ACCESSORY_ID } from "@/constants";
import type { ComponentsV2Components } from "@/types/seyfert";
import {
  findItemById,
  parseGearbuilderComponentsIntoPlayer,
  serializeTopLevelComponent,
} from "@/utils";
import {
  ActionRow,
  Button,
  ButtonStyle,
  ComponentCommand,
  ComponentContext,
} from "seyfert";

export default class GearbuilderChooseAccessoryOneButton extends ComponentCommand {
  componentType = "Button" as const;

  override filter(ctx: ComponentContext<typeof this.componentType>) {
    return ctx.customId === "gb_choose_acc_1";
  }

  async run(ctx: ComponentContext<typeof this.componentType>) {
    const row = new ActionRow();

    row.addComponents(
      new Button()
        .setLabel("Item")
        .setCustomId("gb_modify_item_acc_1")
        .setStyle(ButtonStyle.Primary)
    );

    const components: ComponentsV2Components = ctx.message.components.map(
      serializeTopLevelComponent
    );

    const player = await parseGearbuilderComponentsIntoPlayer(components);

    if (
      player.accessories[0] &&
      player.accessories[0]?.itemId !== EMPTY_ACCESSORY_ID
    ) {
      const item = await findItemById(player.accessories[0]?.itemId);

      if (item) {
        row.addComponents(
          new Button()
            .setLabel("Enchant")
            .setCustomId("gb_modify_enchant_acc_1")
            .setStyle(ButtonStyle.Primary)
        );

        if (item.validModifiers.length > 0) {
          row.addComponents(
            new Button()
              .setLabel("Modifier")
              .setCustomId("gb_modify_modifier_acc_1")
              .setStyle(ButtonStyle.Primary)
          );
        }

        if (item.gemNo > 0) {
          row.addComponents(
            new Button()
              .setLabel("Gem(s)")
              .setCustomId("gb_modify_gem_acc_1")
              .setStyle(ButtonStyle.Primary)
          );
        }
      }
    }

    if (row.components.length > 0) {
      await ctx.write({
        content: "What to modify about Accessory 1?",
        components: [row],
      });
    } else {
      await ctx.write({
        content:
          "An error has occurred when trying to send modify menu for accessory 1. Please contact the developer.",
      });
    }
  }
}
