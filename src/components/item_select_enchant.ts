import { ActionRow, Button, ComponentCommand, ComponentContext } from "seyfert";
import {
  findEnchantByName,
  findItemById,
  parseEmbedIntoSlot,
  slotIntoEmbed,
} from "../utils";
import { ButtonStyle } from "seyfert/lib/types";

export default class ItemSelectEnchantSelectMenu extends ComponentCommand {
  componentType = "StringSelect" as const;

  override filter(ctx: ComponentContext<typeof this.componentType>) {
    return ctx.customId === "item_select_enchant";
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

    const enchantName = ctx.interaction.data.values[0] ?? "";

    const slot = await parseEmbedIntoSlot(oldEmbed);
    const enchant = await findEnchantByName(enchantName);

    if (!enchant) {
      await ctx.editResponse({
        content:
          "Error: selected enchant does not exist (somehow?). Please report this to the developer.",
        embeds: [],
        components: [],
      });
      return;
    }

    slot.enchant_id = enchant.id;

    const embed = await slotIntoEmbed(ctx, slot);

    const item = await findItemById(slot.item_id);

    if (!item) {
      await ctx.editResponse({
        content:
          "Error: item id stored in previous embed does not seem to be valid. Please report this to the developer.",
        embeds: [],
        components: [],
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
      embeds: [embed],
      components: [row],
    });
  }
}
