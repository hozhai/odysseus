import { openGearbuilderSearchModal } from "@/utils";
import { ComponentCommand, ComponentContext } from "seyfert";

export default class GearbuilderModifyEnchantAccessoryThreeButton extends ComponentCommand {
  componentType = "Button" as const;

  override filter(ctx: ComponentContext<typeof this.componentType>) {
    return ctx.customId.startsWith("gb_modify_enchant_acc_3_");
  }

  async run(ctx: ComponentContext<typeof this.componentType>) {
    const originalMessageId = ctx.customId.slice(
      "gb_modify_enchant_acc_3_".length
    );

    if (!originalMessageId) {
      await ctx.update({
        content: "Could not identify the original Gearbuilder message.",
        components: [],
      });
      return;
    }

    await openGearbuilderSearchModal(
      ctx,
      "enchant",
      "acc_3",
      "Accessory Slot 3",
      originalMessageId
    );
  }
}
