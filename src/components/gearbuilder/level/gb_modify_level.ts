import { MAX_LEVEL_PLAYER } from "@/constants";
import {
  ComponentCommand,
  ComponentContext,
  Label,
  Modal,
  TextDisplay,
  TextInput,
  TextInputStyle,
} from "seyfert";

export default class GearbuilderModifyLevelButton extends ComponentCommand {
  componentType = "Button" as const;

  override filter(ctx: ComponentContext<typeof this.componentType>) {
    return ctx.customId === "gb_modify_level";
  }

  async run(ctx: ComponentContext<typeof this.componentType>) {
    const levelText = new TextDisplay()
      .setId(1)
      .setContent(
        `The current maximum achievable level is ${MAX_LEVEL_PLAYER}.\nThis action will revert any changes made to the stat allocations section and the magics/fighting styles section.`
      );

    const levelInput = new TextInput()
      .setCustomId("gb_select_level_level")
      .setStyle(TextInputStyle.Short)
      .setLength({ max: 3, min: 1 });

    const levelLabel = new Label().setLabel("Level").setComponent(levelInput);

    const originalMessageId = ctx.message.id;

    const modal = new Modal()
      .setTitle("Level")
      .setCustomId(`gb_select_level_${originalMessageId}`)
      .addComponents([levelText, levelLabel]);

    await ctx.interaction.modal(modal);
  }
}
