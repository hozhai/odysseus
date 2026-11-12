import { EMPTY_CHESTPLATE_ID } from "@/constants";
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

export default class GearbuilderChooseChestButton extends ComponentCommand {
  componentType = "Button" as const;

  override filter(ctx: ComponentContext<typeof this.componentType>) {
    return ctx.customId === "gb_choose_chest";
  }

  async run(ctx: ComponentContext<typeof this.componentType>) {
    const row = new ActionRow();

    row.addComponents(
      new Button()
        .setLabel("Item")
        .setCustomId(`gb_modify_item_chest_${ctx.message.id}`)
        .setStyle(ButtonStyle.Primary)
    );

    const components: ComponentsV2Components = ctx.message.components.map(
      serializeTopLevelComponent
    );
    const chestplate = (await parseGearbuilderComponentsIntoPlayer(components))
      .chestplate;

    const enchantButton = new Button()
      .setLabel("Enchant")
      .setCustomId(`gb_modify_enchant_chest_${ctx.message.id}`)
      .setStyle(ButtonStyle.Primary);

    const modifierButton = new Button()
      .setLabel("Modifier")
      .setCustomId(`gb_modify_modifier_chest_${ctx.message.id}`)
      .setStyle(ButtonStyle.Primary);

    const gemButton = new Button()
      .setLabel("Gem(s)")
      .setCustomId(`gb_modify_gem_chest_${ctx.message.id}`)
      .setStyle(ButtonStyle.Primary);

    const item = await findItemById(chestplate.itemId);

    if (item && item.id !== EMPTY_CHESTPLATE_ID) {
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
      content: "What to modify about the Chestplate?",
      components: [row],
    });
  }
}
