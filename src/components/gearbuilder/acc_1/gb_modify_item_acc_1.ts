import {
  ComponentCommand,
  ComponentContext,
  Label,
  Modal,
  TextInput,
  TextInputStyle,
} from "seyfert";

export default class GearbuilderModifyAccesoryOneButton extends ComponentCommand {
  componentType = "Button" as const;

  override filter(ctx: ComponentContext<typeof this.componentType>) {
    return ctx.customId === "gb_modify_item_acc_1";
  }

  async run(ctx: ComponentContext<typeof this.componentType>) {
    const textInput = new TextInput()
      .setCustomId("gb_modal_item_acc_1_text")
      .setRequired(true)
      .setStyle(TextInputStyle.Short);

    const label = new Label()
      .setLabel("Search for an item...")
      .setComponent(textInput);

    const modal = new Modal()
      .setTitle("Item - Accessory 1")
      .setCustomId("gb_modal_item_acc_1")
      .setComponents([label]);

    await ctx.modal(modal);
  }
}
