import {
  ActionRow,
  ComponentCommand,
  ComponentContext,
  MessageFlags,
  StringSelectMenu,
  StringSelectOption,
} from "seyfert";
import { getData } from "../../data/loadData";
import { itemEnchantToEmoji } from "../../utils";

export default class ItemSetEnchantButton extends ComponentCommand {
  componentType = "Button" as const;

  override filter(ctx: ComponentContext<typeof this.componentType>) {
    return ctx.customId === "item_set_enchant";
  }

  async run(ctx: ComponentContext<typeof this.componentType>) {
    await ctx.deferUpdate(); // do not remove lmao

    const msg = ctx.interaction?.message;
    const oldEmbed = msg?.embeds?.[0];

    if (!oldEmbed) {
      await ctx.editOrReply({
        content: "Error: previous message did not contain a valid oldEmbed.",
        embeds: [],
        components: [],
      });
      return;
    }

    if (ctx.author.username !== oldEmbed?.author?.name) {
      await ctx.followup({
        content: "You can only edit your own item.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const enchantData = (await getData()).enchants;

    const selectMenu = new StringSelectMenu()
      .setCustomId("item_select_enchant")
      .setPlaceholder("Select an enchant...")
      .setRequired(true)
      .setValuesLength({ max: 1, min: 1 });

    Object.values(enchantData)
      .filter(
        (val) =>
          val.mainType === "Enchant" &&
          val.name !== "Sturdy" &&
          val.name !== "Reinforced" &&
          val.name !== "Warship"
      )
      .forEach((ench) => {
        const option = new StringSelectOption();
        option.setLabel(ench.name);
        option.setValue(ench.name.toLowerCase());

        const emoji = itemEnchantToEmoji(ench);
        if (emoji) {
          option.setEmoji(emoji);
        }

        selectMenu.addOption([option]);
      });

    const row = new ActionRow().setComponents([selectMenu]);

    await ctx.editOrReply({
      embeds: [oldEmbed],
      components: [row],
    });
  }
}
