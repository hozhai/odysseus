import { findItemsFromQuery } from "@/utils";
import {
  ActionRow,
  Button,
  ButtonStyle,
  MessageFlags,
  ModalCommand,
  ModalContext,
} from "seyfert";

export default class GearbuilderModalItemAccesoryOneModal extends ModalCommand {
  override filter(ctx: ModalContext) {
    return ctx.customId === "gb_modal_item_acc_1";
  }

  async run(ctx: ModalContext) {
    let query = ctx.getInputValue("gb_modal_item_acc_1_text", true);

    if (Array.isArray(query)) {
      query = query.join(" ");
    }

    const items = await findItemsFromQuery(query);

    if (!items) {
      await ctx.write({
        content: `You searched for \`${query}\`. No item matched your query - please try again.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const row = new ActionRow();

    let i = 1;
    for (const item of items) {
      row.addComponents(
        new Button()
          .setLabel(`#${i}`)
          .setCustomId(`gb_select_item_acc_1_${item.id}`)
          .setStyle(ButtonStyle.Secondary)
      );
      i++;
    }

    await ctx.write({
      content: `You searched for \`${query}\`. Select a result:\n${items.map((item, idx) => `#${idx + 1} - ${item.name}`).join("\n")}\n-# ${ctx.interaction.message?.id}`,
      components: [row],
      flags: MessageFlags.Ephemeral,
    });
  }
}
