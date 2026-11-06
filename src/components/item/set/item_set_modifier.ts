import {
  ActionRow,
  ComponentCommand,
  ComponentContext,
  StringSelectMenu,
  StringSelectOption,
} from "seyfert";
import { getData } from "@data";
import { findItemById, itemModifierToEmoji } from "@utils";
import { EMPTY_MODIFIER_ID } from "@/constants";

export default class ItemSetModifierButton extends ComponentCommand {
  componentType = "Button" as const;

  override filter(ctx: ComponentContext<typeof this.componentType>) {
    return ctx.customId === "item_set_modifier";
  }

  async run(ctx: ComponentContext<typeof this.componentType>) {
    await ctx.deferUpdate(); // do not remove lmao

    const msg = ctx.interaction?.message;
    const oldEmbed = msg?.embeds?.[0];

    if (!oldEmbed) {
      await ctx.editOrReply({
        content: "Error: previous message did not contain a valid embed.",
        embeds: [],
        components: [],
      });
      return;
    }

    const modifierData = (await getData()).modifiers;

    const item = await findItemById(oldEmbed.title?.split(" | ")[1] ?? "");

    if (!item) {
      await ctx.editOrReply({
        content:
          "Error: previous message embed does not contain a valid item id. Please report this to the developer.",
      });
      return;
    }

    const selectMenu = new StringSelectMenu()
      .setCustomId("item_select_modifier")
      .setPlaceholder("Select a modifier...")
      .setRequired(true)
      .setValuesLength({ max: 1, min: 1 });

    for (const modifier of Object.values(modifierData)) {
      if (
        // De Morgan's law
        !item.validModifiers?.includes(modifier.name) &&
        modifier.id !== EMPTY_MODIFIER_ID
      )
        continue;

      const option = new StringSelectOption()
        .setLabel(modifier.name)
        .setValue(modifier.name.toLowerCase());

      const emoji = await itemModifierToEmoji(modifier);

      if (emoji) {
        option.setEmoji(emoji);
      }

      selectMenu.addOption([option]);
    }

    const row = new ActionRow().setComponents([selectMenu]);

    await ctx.editOrReply({
      embeds: [oldEmbed],
      components: [row],
    });
  }
}
