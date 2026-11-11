import { findEnchantsFromQuery } from "@/utils";
import {
  ActionRow,
  Button,
  ButtonStyle,
  ComponentCommand,
  ComponentContext,
} from "seyfert";

export default class GearbuilderModifyEnchantAccessoryOneButton extends ComponentCommand {
  componentType = "Button" as const;

  override filter(ctx: ComponentContext<typeof this.componentType>) {
    return ctx.customId.startsWith("gb_modify_enchant_acc_1_");
  }

  async run(ctx: ComponentContext<typeof this.componentType>) {
    const originalMessageId = ctx.customId.slice(
      "gb_modify_enchant_acc_1_".length
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
      content: "Enchant for Accessory Slot 1: Type your search query below...",
      components: [],
    });

    ctx.client.collectors.create({
      event: "messageCreate",
      filter: (msg) => msg.author.id === ctx.author.id,
      idle: 1000 * 60,
      timeout: 1000 * 60 * 10,
      run: async (message, stop) => {
        stop();
        await message.delete();

        const query = message.content;
        const items = await findEnchantsFromQuery(query);

        if (items.length === 0) {
          const retryRow = new ActionRow().addComponents(
            new Button()
              .setLabel("Try another search")
              .setCustomId(`gb_modify_enchant_acc_1_${originalMessageId}`)
              .setStyle(ButtonStyle.Primary)
          );

          await responseMessage.edit({
            content: `You searched for \`${query}\`. No item matched your query - please try again.`,
            components: [retryRow],
          });
          return;
        }

        const row = new ActionRow();

        let i = 1;
        for (const item of items) {
          row.addComponents(
            new Button()
              .setLabel(`#${i}`)
              .setCustomId(
                `gb_select_enchant_acc_1_${item.id}_${originalMessageId}`
              )
              .setStyle(ButtonStyle.Secondary)
          );
          i++;
        }

        await responseMessage.edit({
          content: `You searched for \`${query}\`. Select a result:\n${items.map((item, idx) => `#${idx + 1} - ${item.name}`).join("\n")}`,
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
