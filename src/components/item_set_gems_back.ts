import { ActionRow, Button, ComponentCommand, ComponentContext } from "seyfert";
import { findItemById, parseEmbedIntoSlot } from "../utils";
import { ButtonStyle } from "seyfert/lib/types";

export default class ItemSetGemsBackButton extends ComponentCommand {
  componentType = "Button" as const;

  override filter(ctx: ComponentContext<typeof this.componentType>) {
    return ctx.customId === "item_set_gems_back";
  }

  async run(ctx: ComponentContext<typeof this.componentType>) {
    await ctx.deferUpdate();

    const msg = ctx.interaction?.message;
    const oldEmbed = msg?.embeds?.[0];

    if (!oldEmbed) {
      await ctx.editResponse({
        content: "Error: previous message did not contain a valid embed.",
        embeds: [],
        components: [],
      });
      return;
    }

    const slot = await parseEmbedIntoSlot(oldEmbed);

    const item = await findItemById(slot.item_id);

    if (!item) {
      await ctx.editResponse({
        content: "Error: previous message did not contain a valid item id.",
      });
      return;
    }

    const components = [
      new Button()
        .setLabel("Add Enchant")
        .setCustomId("item_set_enchant")
        .setStyle(ButtonStyle.Secondary),
    ];

    if (item.validModifiers) {
      components.push(
        new Button()
          .setLabel("Add Modifier")
          .setCustomId("item_set_modifier")
          .setStyle(ButtonStyle.Secondary)
      );
    }

    if (item.gemNo) {
      components.push(
        new Button()
          .setLabel("Add Gems")
          .setCustomId("item_set_gems")
          .setStyle(ButtonStyle.Secondary)
      );
    }

    const row = new ActionRow().setComponents(components);

    await ctx.editResponse({
      embeds: [oldEmbed],
      components: [row],
    });
  }
}
