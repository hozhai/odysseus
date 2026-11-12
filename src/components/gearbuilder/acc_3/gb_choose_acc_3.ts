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

export default class GearbuilderChooseAccessoryThreeButton extends ComponentCommand {
  componentType = "Button" as const;

  override filter(ctx: ComponentContext<typeof this.componentType>) {
    return ctx.customId === "gb_choose_acc_3";
  }

  async run(ctx: ComponentContext<typeof this.componentType>) {
    const row = new ActionRow();

    row.addComponents(
      new Button()
        .setLabel("Item")
        .setCustomId(`gb_modify_item_acc_3_${ctx.message.id}`)
        .setStyle(ButtonStyle.Primary)
    );

    const components: ComponentsV2Components = ctx.message.components.map(
      serializeTopLevelComponent
    );

    const player = await parseGearbuilderComponentsIntoPlayer(components);
    const accessory = player.accessories[2];

    const enchantButton = new Button()
      .setLabel("Enchant")
      .setCustomId(`gb_modify_enchant_acc_3_${ctx.message.id}`)
      .setStyle(ButtonStyle.Primary);

    const modifierButton = new Button()
      .setLabel("Modifier")
      .setCustomId(`gb_modify_modifier_acc_3_${ctx.message.id}`)
      .setStyle(ButtonStyle.Primary);

    const gemButton = new Button()
      .setLabel("Gem(s)")
      .setCustomId(`gb_modify_gem_acc_3_${ctx.message.id}`)
      .setStyle(ButtonStyle.Primary);

    const item = accessory ? await findItemById(accessory.itemId) : null;

    if (item && item.id !== EMPTY_ACCESSORY_ID) {
      enchantButton.setDisabled(false);
      gemButton.setDisabled(item.gemNo === 0);
      modifierButton.setDisabled(item.validModifiers.length === 0);
    } else {
      enchantButton.setDisabled(true);
      gemButton.setDisabled(true);
      modifierButton.setDisabled(true);
    }

    row.addComponents(enchantButton, modifierButton, gemButton);

    await ctx.write({
      content: "What to modify about Accessory 3?",
      components: [row],
    });
  }
}
