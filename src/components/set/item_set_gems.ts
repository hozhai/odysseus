import { ActionRow, Button, ComponentCommand, ComponentContext } from "seyfert";
import { findItemById } from "../../utils";
import { ButtonStyle, MessageFlags } from "seyfert/lib/types";

export default class ItemSetGemsButton extends ComponentCommand {
  componentType = "Button" as const;

  override filter(ctx: ComponentContext<typeof this.componentType>) {
    return ctx.customId === "item_set_gems";
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

    if (ctx.author.username !== oldEmbed?.author?.name) {
      await ctx.followup({
        content: "You can only edit your own item.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const item = await findItemById(oldEmbed.title?.split(" | ")[1] ?? "");

    if (!item) {
      await ctx.editOrReply({
        content:
          "Error: previous message embed does not contain a valid item id. Please report this to the developer.",
      });
      return;
    }

    const gemNo = item.gemNo;

    if (!gemNo || gemNo === 0) {
      await ctx.editOrReply({
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
      .setStyle(ButtonStyle.Secondary)
      // enable when we have fused gems figured out
      .setDisabled(true);

    const backBtn = new Button()
      .setCustomId("item_set_gems_back")
      .setLabel("Back")
      .setStyle(ButtonStyle.Danger);

    const row = new ActionRow().setComponents([
      regularGemsBtn,
      hybridGemsBtn,
      backBtn,
    ]);

    await ctx.editOrReply({
      embeds: [oldEmbed],
      components: [row],
    });
  }
}
