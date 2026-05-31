import {
  ActionRow,
  ComponentCommand,
  ComponentContext,
  StringSelectMenu,
  StringSelectOption,
  type ActionBuilderComponents,
} from "seyfert";
import { getData } from "../data/load";
import { findItemById, itemGemToEmoji } from "../utils";

export default class ItemSetGemsButton extends ComponentCommand {
  componentType = "Button" as const;

  override filter(ctx: ComponentContext<typeof this.componentType>) {
    return ctx.customId === "item_set_gems";
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

    const item = await findItemById(embed.title?.split(" | ")[1] ?? "");

    if (!item) {
      await ctx.editResponse({
        content:
          "Error: previous message embed does not contain a valid item id. Please report this to the developer.",
      });
      return;
    }

    const selectMenus: StringSelectMenu[] = [];

    const gemNo = item.gemNo;

    if (!gemNo || gemNo === 0) {
      await ctx.editResponse({
        content:
          "Error: item with gemNo suddenly has no gemNo. Please report this to the developer.",
      });
      return;
    }

    for (let i = 0; i < gemNo; i++) {
      selectMenus.push(
        new StringSelectMenu()
          .setCustomId("item_select_gems")
          .setPlaceholder(`Select gem #${i + 1}...`)
          .setRequired(true)
          .setValuesLength({ max: 1, min: 1 })
      );
    }

    Object.values(gemData).forEach((gem) => {
      const option = new StringSelectOption();
      option.setLabel(gem.name);
      option.setValue(gem.name.toLowerCase());

      const emoji = itemGemToEmoji(gem);
      if (emoji) {
        option.setEmoji(emoji);
      }

      selectMenus.forEach((selectMenu) => selectMenu.addOption(option));
    });

    const rows: ActionRow<ActionBuilderComponents>[] = [];

    for (let i = 0; i < gemNo; i++) {
      // we know that selectMenus[i] will not be undefined
      // because each gemNo is guaranteed to have a matching selectMenu
      rows.push(new ActionRow().setComponents(selectMenus[i]!));
    }

    await ctx.editResponse({
      embeds: [embed],
      components: rows,
    });
  }
}
