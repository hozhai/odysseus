import {
  ComponentCommand,
  ComponentContext,
  ContextComponentCommandInteractionMap,
} from "seyfert";

export default class ItemSelectEnchantSelectMenu extends ComponentCommand {
  componentType = "StringSelect" as const;

  filter(ctx: ComponentContext<typeof this.componentType>) {
    return ctx.customId == "item_select_enchant";
  }

  async run(ctx: ComponentContext<typeof this.componentType>) {
    ctx.deferUpdate();

    const msg = ctx.interaction?.message;
    const embed = msg?.embeds?.[0];

    // TODO
  }
}
