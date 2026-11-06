import {
  ActionRow,
  ComponentCommand,
  ComponentContext,
  MessageFlags,
  StringSelectMenu,
  StringSelectOption,
} from "seyfert";
import { getData } from "@data";
import { findItemById, itemGemToEmoji, parseEmbedIntoSlot } from "@utils";

export default class ItemSetGemsRegularButton extends ComponentCommand {
  componentType = "Button" as const;

  override filter(ctx: ComponentContext<typeof this.componentType>) {
    return ctx.customId === "item_set_gems_regular";
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

    const gemData = (await getData()).gems;

    const slot = await parseEmbedIntoSlot(oldEmbed);

    const item = await findItemById(slot.item_id);

    if (!item) {
      await ctx.editOrReply({
        content:
          "Error: previous message embed does not contain a valid item id. Please report this to the developer.",
      });
      return;
    }

    const selectMenu = new StringSelectMenu()
      .setCustomId("item_select_gems_regular")
      .setPlaceholder("Select a regular gem...")
      .setRequired(true)
      .setValuesLength({ max: item?.gemNo ?? 0, min: 0 });

    for (const gem of Object.values(gemData)) {
      if (gem.fused) continue;

      const option = new StringSelectOption()
        .setLabel(gem.name)
        .setValue(gem.name.toLowerCase());

      const emoji = await itemGemToEmoji(gem);

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
