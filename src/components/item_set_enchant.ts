import { ComponentCommand, ComponentContext } from "seyfert";

export default class ItemSetEnchantButton extends ComponentCommand {
  componentType = "Button" as const;

  filter(ctx: ComponentContext<typeof this.componentType>) {
    return ctx.customId === "item_set_enchant";
  }

  async run(ctx: ComponentContext<typeof this.componentType>) {
    return ctx.write({
      content: "item_set_enchant pressed!",
    });
  }
}
