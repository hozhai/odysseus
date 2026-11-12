import type { ComponentsV2Components } from "@/types/seyfert";
import {
  findItemById,
  findModifiersFromQuery,
  parseGearbuilderComponentsIntoPlayer,
  serializeTopLevelComponent,
} from "@/utils";
import {
  ActionRow,
  Button,
  ButtonStyle,
  ComponentCommand,
  ComponentContext,
} from "seyfert";

export default class GearbuilderModifyModifierPantsButton extends ComponentCommand {
  componentType = "Button" as const;

  override filter(ctx: ComponentContext<typeof this.componentType>) {
    return ctx.customId.startsWith("gb_modify_modifier_pants_");
  }

  async run(ctx: ComponentContext<typeof this.componentType>) {
    const originalMessageId = ctx.customId.slice(
      "gb_modify_modifier_pants_".length
    );

    if (!originalMessageId) {
      await ctx.update({
        content: "Could not identify the original Gearbuilder message.",
        components: [],
      });
      return;
    }

    const originalMessage = await ctx.client.messages.fetch(
      originalMessageId,
      ctx.channelId
    );
    const components: ComponentsV2Components = originalMessage.components.map(
      serializeTopLevelComponent
    );
    const player = await parseGearbuilderComponentsIntoPlayer(components);
    const validModifiers =
      (await findItemById(player.boots.itemId))?.validModifiers ?? [];

    const responseMessage = ctx.message;

    await ctx.update({
      content: "Modifier for the Pants: Type your search query below...",
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
        const modifiers = await findModifiersFromQuery(query, validModifiers);

        if (modifiers.length === 0) {
          const retryRow = new ActionRow().addComponents(
            new Button()
              .setLabel("Try another search")
              .setCustomId(`gb_modify_modifier_pants_${originalMessageId}`)
              .setStyle(ButtonStyle.Primary)
          );

          await responseMessage.edit({
            content: `You searched for \`${query}\`. No modifier matched your query - please try again.`,
            components: [retryRow],
          });
          return;
        }

        const row = new ActionRow().addComponents(
          ...modifiers.map((modifier, index) =>
            new Button()
              .setLabel(`#${index + 1}`)
              .setCustomId(
                `gb_select_modifier_pants_${modifier.id}_${originalMessageId}`
              )
              .setStyle(ButtonStyle.Secondary)
          )
        );

        await responseMessage.edit({
          content: `You searched for \`${query}\`. Select a result:\n${modifiers.map((modifier, index) => `#${index + 1} - ${modifier.name}`).join("\n")}`,
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
