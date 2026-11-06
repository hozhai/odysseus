import { ActionRow, Button, ComponentCommand, ComponentContext } from "seyfert";

export default class GearbuilderChooseAccessoryOneButton extends ComponentCommand {
  componentType = "Button" as const;

  override filter(ctx: ComponentContext<typeof this.componentType>) {
    return ctx.customId === "gb_choose_acc_1";
  }

  async run(ctx: ComponentContext<typeof this.componentType>) {
    const row = new ActionRow();

    row.addComponents(
      new Button().setLabel("Item").setCustomId("gb_modify_acc_1")
    );

    const oldMsgComponent = ctx.message.components.map((component) =>
      component.toJSON()
    ) as NonNullable<Parameters<typeof ctx.message.edit>[0]["components"]>;

    // TODO
  }
}
