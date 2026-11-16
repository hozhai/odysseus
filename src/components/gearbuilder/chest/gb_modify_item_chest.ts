import { openGearbuilderItemSearchModal } from "@/utils";
import { ComponentCommand, ComponentContext } from "seyfert";

export default class GearbuilderModifyItemChestButton extends ComponentCommand {
  componentType = "Button" as const;

  override filter(ctx: ComponentContext<typeof this.componentType>) {
    return ctx.customId.startsWith("gb_modify_item_chest_");
  }

  async run(ctx: ComponentContext<typeof this.componentType>) {
    const originalMessageId = ctx.customId.slice(
      "gb_modify_item_chest_".length
    );

    if (!originalMessageId) {
      await ctx.update({
        content: "Could not identify the original Gearbuilder message.",
        components: [],
      });
      return;
    }

    await openGearbuilderItemSearchModal(
      ctx,
      "chest",
      "Chestplate",
      originalMessageId
    );
  }
}
