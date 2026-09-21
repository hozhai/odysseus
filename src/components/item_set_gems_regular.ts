import {
  ActionRow,
  ComponentCommand,
  ComponentContext,
  StringSelectMenu,
  StringSelectOption,
} from "seyfert";
import { getData } from "../data/load";
import { findItemById, itemGemToEmoji, parseEmbedIntoSlot } from "../utils";

export default class ItemSetGemsRegularButton extends ComponentCommand {
  componentType = "Button" as const;

  override filter(ctx: ComponentContext<typeof this.componentType>) {
    return ctx.customId === "item_set_gems_regular";
  }

  async run(ctx: ComponentContext<typeof this.componentType>) {
    await ctx.deferUpdate(); // do not remove lmao

    const msg = ctx.interaction?.message;
    const embed = msg?.embeds?.[0];

    if (!embed) {
      await ctx.editResponse({
        content: "Error: previous message did not contain a valid embed.",
        embeds: [],
        components: [],
      });
      return;
    }

    const gemData = (await getData()).gems;

    const slot = await parseEmbedIntoSlot(embed);

    const item = await findItemById(slot.item_id);

    const selectMenu = new StringSelectMenu()
      .setCustomId("item_select_gems_regular")
      .setPlaceholder("Select a regular gem...")
      .setRequired(true)
      .setValuesLength({ max: item?.gemNo ?? 0, min: 0 });

    Object.values(gemData)
      .filter((val) => !val.hybrid)
      .forEach((gem) => {
        const option = new StringSelectOption();
        option.setLabel(gem.name);
        option.setValue(gem.id); // ID INSTEAD OF NAME AS VALUE

        const emoji = itemGemToEmoji(gem);
        if (emoji) {
          option.setEmoji(emoji);
        }

        selectMenu.addOption([option]);
      });

    const row = new ActionRow().setComponents([selectMenu]);

    await ctx.editResponse({
      embeds: [embed],
      components: [row],
    });
  }
}
