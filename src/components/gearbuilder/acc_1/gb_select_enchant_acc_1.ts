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
import { EMPTY_ACCESSORY_ID, EMPTY_MODIFIER_ID } from "@/constants";

export default class GearbuilderSelectEnchantAccessoryOneIdButton extends ComponentCommand {
  componentType = "Button" as const;

  override filter(ctx: ComponentContext<typeof this.componentType>) {
    return ctx.customId.startsWith("gb_select_enchant_acc_1_");
  }

  async run(ctx: ComponentContext<typeof this.componentType>) {
    const [enchantId, originalMessageId] = ctx.customId
      .slice("gb_select_enchant_acc_1_".length)
      .split("_");

    if (!enchantId || !originalMessageId) {
      await ctx.update({
        content:
          "Could not identify the selected enchant or original Gearbuilder message.",
        components: [],
      });
      return;
    }

    const enchant = await findEnchantById(enchantId);
    if (!enchant) {
      await ctx.update({
        content:
          "The selected enchant could not be found. Please contact the developer and try again.",
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
    const item = await findItemById(
      player.accessories[0]?.itemId ?? EMPTY_ACCESSORY_ID
    );
    const modifier = await findModifierById(
      player.accessories[0]?.modifierId ?? EMPTY_MODIFIER_ID
    );

    const gems = await Promise.all(
      player.accessories[0].gemIds.map(
        async (gemId) => await findGemById(gemId)
      )
    );

    const gemEmojis = (
      await Promise.all(
        gems
          .filter((gem) => gem !== null)
          .map(async (gem) => (await itemGemToEmoji(gem)) as string)
      )
    ).join(" ");

    if (!item) {
      await ctx.update({
        content:
          "The affected slot's item was not found. Please contact the developer and try again.",
        components: [],
      });
      return;
    }

    if (!modifier) {
      await ctx.update({
        content:
          "The affected slot's modifier was not found. Please contact the developer and try again.",
        components: [],
      });
      return;
    }

    const enchantEmoji = await itemEnchantToEmoji(enchant);
    const modifierEmoji = await itemModifierToEmoji(modifier);

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

    accessoryDetails.content = `Item: ${item.name}\nEnchant: ${enchantEmoji as string}`;

    if (item.validModifiers.length > 0) {
      accessoryDetails.content += `\nModifier: ${modifierEmoji as string}`;
    }

    if (item.gemNo > 0) {
      accessoryDetails.content += `\nGem(s): ${gemEmojis}`;
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
