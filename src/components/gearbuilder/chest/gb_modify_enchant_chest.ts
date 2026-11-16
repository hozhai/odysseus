import { openGearbuilderSearchModal } from "@/utils";
import { ComponentCommand, ComponentContext } from "seyfert";

export default class GearbuilderModifyEnchantChestButton extends ComponentCommand {
  componentType = "Button" as const;

  override filter(ctx: ComponentContext<typeof this.componentType>) {
    return ctx.customId.startsWith("gb_modify_enchant_chest_");
  }

  async run(ctx: ComponentContext<typeof this.componentType>) {
    const originalMessageId = ctx.customId.slice(
      "gb_modify_enchant_chest_".length
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
      "chest",
      "Chestplate",
      originalMessageId
    );
  }
}
