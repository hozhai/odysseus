import {
  ActionRow,
  ComponentCommand,
  ComponentContext,
  SelectMenu,
} from "seyfert";

export default class ItemSetEnchantButton extends ComponentCommand {
  componentType = "Button" as const;

  filter(ctx: ComponentContext<typeof this.componentType>) {
    return ctx.customId === "item_set_enchant";
  }

  async run(ctx: ComponentContext<typeof this.componentType>) {
    const msg = ctx.interaction?.message;
    const embed = msg?.embeds?.[0];

    // TODO
    const row = new ActionRow().setComponents([]);

    return ctx.write({
      content: `item_set_enchant pressed! ${embed?.title ?? ""}`,
    });
  }
}
