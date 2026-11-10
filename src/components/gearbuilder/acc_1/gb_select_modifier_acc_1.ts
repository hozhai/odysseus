import {
  ComponentCommand,
  ComponentContext,
  ComponentType,
  MessageFlags,
} from "seyfert";
import {
  findEnchantById,
  findGemById,
  findItemById,
  findModifierById,
  itemEnchantToEmoji,
  itemGemToEmoji,
  itemModifierToEmoji,
  parseGearbuilderComponentsIntoPlayer,
  serializeTopLevelComponent,
} from "@/utils";
import type { ComponentsV2Components } from "@/types/seyfert";

export default class GearbuilderSelectModifierAccessoryOneIdButton extends ComponentCommand {
  componentType = "Button" as const;

  override filter(ctx: ComponentContext<typeof this.componentType>) {
    return ctx.customId.startsWith("gb_select_modifier_acc_1_");
  }

  async run(ctx: ComponentContext<typeof this.componentType>) {
    const [modifierId, originalMessageId] = ctx.customId
      .slice("gb_select_modifier_acc_1_".length)
      .split("_");

    if (!modifierId || !originalMessageId) {
      await ctx.update({
        content:
          "Could not identify the selected modifier or original Gearbuilder message.",
        components: [],
      });
      return;
    }

    const modifier = await findModifierById(modifierId);
    if (!modifier) {
      await ctx.update({
        content:
          "The selected modifier could not be found. Please contact the developer and try again.",
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

    const player = await parseGearbuilderComponentsIntoPlayer(components);
    const item = await findItemById(player.accessories[0].itemId);
    const enchant = await findEnchantById(player.accessories[0].enchantId);

    const gems = await Promise.all(
      player.accessories[0].gemIds.map(
        async (gemId) => await findGemById(gemId)
      )
    );

    if (!item) {
      await ctx.update({
        content:
          "The affected slot's item was not found. Please contact the developer and try again.",
        components: [],
      });
      return;
    }

    if (!enchant) {
      await ctx.update({
        content:
          "The affected slot's modifier was not found. Please contact the developer and try again.",
        components: [],
      });
      return;
    }

    const gemEmojis = (
      await Promise.all(
        gems
          .filter((gem) => gem !== null)
          .map(async (gem) => (await itemGemToEmoji(gem)) as string)
      )
    ).join(" ");

    const enchantEmoji = await itemEnchantToEmoji(enchant);
    const modifierEmoji = await itemModifierToEmoji(modifier);

    if (!item) {
      await ctx.update({
        content:
          "The affected slot's item was not found. Please contact the developer and try again.",
        components: [],
      });
      return;
    }

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

    accessoryDetails.content = `Item: ${item.name}\nEnchant: ${(enchantEmoji as string) ?? "Unset"}`;

    if (item.validModifiers.length > 0) {
      accessoryDetails.content += `\nModifier: ${(modifierEmoji as string) ?? "Unset"}`;
    }

    if (item.gemNo > 0) {
      accessoryDetails.content += `\nGem(s): ${gemEmojis.trim().length > 0 ? gemEmojis : "Unset"}`;
    }

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
