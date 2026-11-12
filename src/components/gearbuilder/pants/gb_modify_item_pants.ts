import { findItemsFromQuery } from "@/utils";
import {
  ActionRow,
  Button,
  ButtonStyle,
  ComponentCommand,
  ComponentContext,
} from "seyfert";

export default class GearbuilderModifyItemPantsButton extends ComponentCommand {
  componentType = "Button" as const;

  override filter(ctx: ComponentContext<typeof this.componentType>) {
    return ctx.customId.startsWith("gb_modify_item_pants_");
  }

  async run(ctx: ComponentContext<typeof this.componentType>) {
    const originalMessageId = ctx.customId.slice(
      "gb_modify_item_pants_".length
    );

    if (!originalMessageId) {
      await ctx.update({
        content: "Could not identify the original Gearbuilder message.",
        components: [],
      });
      return;
    }

    const responseMessage = ctx.message;

    await ctx.update({
      content: "Item for the Pants: Type your search query below...",
      components: [],
    });

    ctx.client.collectors.create({
      event: "messageCreate",
      filter: (message) => message.author.id === ctx.author.id,
      idle: 1000 * 60,
      timeout: 1000 * 60 * 10,
      run: async (message, stop) => {
        stop();
        await message.delete();

        const query = message.content;
        const items = await findItemsFromQuery(query, "Pants");

        if (items.length === 0) {
          const retryRow = new ActionRow().addComponents(
            new Button()
              .setLabel("Try another search")
              .setCustomId(`gb_modify_item_pants_${originalMessageId}`)
              .setStyle(ButtonStyle.Primary)
          );

          await responseMessage.edit({
            content: `You searched for \`${query}\`. No item matched your query - please try again.`,
            components: [retryRow],
          });
          return;
        }

        const row = new ActionRow().addComponents(
          ...items.map((item, index) =>
            new Button()
              .setLabel(`#${index + 1}`)
              .setCustomId(
                `gb_select_item_pants_${item.id}_${originalMessageId}`
              )
              .setStyle(ButtonStyle.Secondary)
          )
        );

        await responseMessage.edit({
          content: `You searched for \`${query}\`. Select a result:\n${items.map((item, index) => `#${index + 1} - ${item.name}`).join("\n")}`,
          components: [row],
        });
      },
      onRunError: (_arg, error, stop) => {
        stop();
        ctx.client.logger.warn(JSON.stringify(error, null, 2));
      },
    });
  }
}
