import { ComponentCommand, ComponentContext } from "seyfert";
import { parseEmbedIntoSlot } from "../utils";

export default class ItemSelectEnchantSelectMenu extends ComponentCommand {
  componentType = "StringSelect" as const;

  override filter(ctx: ComponentContext<typeof this.componentType>) {
    return ctx.customId == "item_select_enchant";
  }

  async run(ctx: ComponentContext<typeof this.componentType>) {
    await ctx.deferUpdate();

    const msg = ctx.interaction?.message;
    const oldEmbed = msg?.embeds?.[0];

    const slot = await parseEmbedIntoSlot(oldEmbed);

    await ctx.editResponse({
      content: `
      ${JSON.stringify(slot, null, 2)}
      `,
    });
    // TODO
  }
}
