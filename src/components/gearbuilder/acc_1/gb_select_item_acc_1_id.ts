import {
  ComponentCommand,
  ComponentContext,
  ComponentType,
  MessageFlags,
} from "seyfert";
import { findItemById, serializeTopLevelComponent } from "@/utils";
import type { ComponentsV2Components } from "@/types/seyfert";

export default class GearbuilderSelectItemAccessoryOneIdButton extends ComponentCommand {
  componentType = "Button" as const;

  override filter(ctx: ComponentContext<typeof this.componentType>) {
    return ctx.customId.startsWith("gb_select_item_acc_1_");
  }

  async run(ctx: ComponentContext<typeof this.componentType>) {
    const [itemId, originalMessageId] = ctx.customId
      .slice("gb_select_item_acc_1_".length)
      .split("_");

    if (!itemId || !originalMessageId) {
      await ctx.update({
        content:
          "Could not identify the selected item or original Gearbuilder message.",
        components: [],
      });
      return;
    }

    const item = await findItemById(itemId);
    if (!item) {
      await ctx.update({
        content:
          "The selected item could not be found. Please contact the developer and try again.",
        components: [],
      });
      return;
    }

    const originalMessage = await ctx.client.messages.fetch(
      originalMessageId,
      ctx.channelId
    );

    const components: ComponentsV2Components = originalMessage.components.map(
      serializeTopLevelComponent
    );

    const container = components[0];
    if (container?.type !== ComponentType.Container) {
      throw new Error(
        "Original Gearbuilder message has no component container"
      );
    }

    const accessorySection = container.components.filter(
      (component) => component.type === ComponentType.Section
    )[0];
    const accessoryDetails = accessorySection?.components[1];
    if (!accessoryDetails) {
      throw new Error("Original Gearbuilder message has no accessory details");
    }

    // keep these as unset here; we want to reset the addons when a new item is chosen
    accessoryDetails.content = `Item: ${item.name}\nEnchant: Unset`;

    if (item.validModifiers.length > 0)
      accessoryDetails.content += "\nModifier: Unset";
    if (item.gemNo > 0) accessoryDetails.content += "\nGem(s): Unset";

    await originalMessage.edit({
      components,
      flags: MessageFlags.IsComponentsV2,
    });

    await ctx.update({
      content: `Selected ${item.name}.`,
      components: [],
    });

    await ctx.deleteResponse();
  }
}
