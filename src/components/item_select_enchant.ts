import {
  ComponentCommand,
  ComponentContext,
  ContextComponentCommandInteractionMap,
} from "seyfert";
import { parseEmbedIntoSlot } from "../utils";

export default class ItemSelectEnchantSelectMenu extends ComponentCommand {
  componentType = "StringSelect" as const;

  filter(ctx: ComponentContext<typeof this.componentType>) {
    return ctx.customId == "item_select_enchant";
  }

  async run(ctx: ComponentContext<typeof this.componentType>) {
    ctx.deferUpdate();

    const msg = ctx.interaction?.message;
    const oldEmbed = msg?.embeds?.[0];

    const slot = await parseEmbedIntoSlot(oldEmbed);

    ctx.editResponse({
      content: `
      ${JSON.stringify(slot, null, 2)}
      `,
    });
    // TODO
  }
}
