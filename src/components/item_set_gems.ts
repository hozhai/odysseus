import { ActionRow, Button, ComponentCommand, ComponentContext } from "seyfert";
import { findItemById } from "../utils";
import { ButtonStyle } from "seyfert/lib/types";

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

    const item = await findItemById(embed.title?.split(" | ")[1] ?? "");

    if (!item) {
      await ctx.editResponse({
        content:
          "Error: previous message embed does not contain a valid item id. Please report this to the developer.",
      });
      return;
    }

    const gemNo = item.gemNo;

    if (!gemNo || gemNo === 0) {
      await ctx.editResponse({
        content:
          "Error: item with gemNo suddenly has no gemNo. Please report this to the developer.",
      });
      return;
    }

    const regularGemsBtn = new Button()
      .setCustomId("item_set_gems_regular")
      .setLabel("Regular Gems")
      .setStyle(ButtonStyle.Secondary);

    const hybridGemsBtn = new Button()
      .setCustomId("item_set_gems_hybrid")
      .setLabel("Hybrid Gems")
      .setStyle(ButtonStyle.Secondary);

    const backBtn = new Button()
      .setCustomId("item_set_gems_back")
      .setLabel("Back")
      .setStyle(ButtonStyle.Danger);

    const row = new ActionRow().setComponents([
      regularGemsBtn,
      hybridGemsBtn,
      backBtn,
    ]);

    await ctx.editResponse({
      embeds: [embed],
      components: [row],
    });
  }
}
