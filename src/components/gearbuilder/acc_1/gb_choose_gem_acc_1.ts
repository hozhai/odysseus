import { EMPTY_ACCESSORY_ID } from "@/constants";
import type { ComponentsV2Components } from "@/types/seyfert";
import {
  findItemById,
  parseGearbuilderComponentsIntoPlayer,
  serializeTopLevelComponent,
} from "@/utils";
import {
  ActionRow,
  Button,
  ButtonStyle,
  ComponentCommand,
  ComponentContext,
} from "seyfert";

export default class GearbuilderChooseGemAccessoryOneButton extends ComponentCommand {
  componentType = "Button" as const;

  override filter(ctx: ComponentContext<typeof this.componentType>) {
    return ctx.customId.startsWith("gb_choose_gem_acc_1_");
  }

  async run(ctx: ComponentContext<typeof this.componentType>) {
    const originalMessageId = ctx.customId.slice("gb_choose_gem_acc_1_".length);

    if (!originalMessageId) {
      await ctx.update({
        content: "Could not identify the original Gearbuilder message.",
        components: [],
      });
      return;
    }

    const originalMessage = await ctx.client.messages.fetch(
      originalMessageId,
      ctx.channelId
    );

    const row = new ActionRow();

    const components: ComponentsV2Components = originalMessage.components.map(
      serializeTopLevelComponent
    );

    const player = await parseGearbuilderComponentsIntoPlayer(components);

    const accessoryOne = player.accessories[0];

    const item = accessoryOne ? await findItemById(accessoryOne?.itemId) : null;

    if (item && item.id !== EMPTY_ACCESSORY_ID) {
      const gemNo = item.gemNo;

      for (let i = 1; i <= gemNo; i++) {
        row.addComponents(
          new Button()
            .setLabel(`#${i}`)
            .setCustomId(`gb_modify_gem_acc_1_${i}_${originalMessageId}`)
            .setStyle(ButtonStyle.Secondary)
        );
      }

      await ctx.write({
        content: "Which gem of Accessory 1 would you like to modify?",
        components: [row],
      });

      return;
    }

    await ctx.write({
      content:
        "Error finding item whilst displaying gem choosing menu. Please contact the developer and try again.",
      components: [],
    });
  }
}
