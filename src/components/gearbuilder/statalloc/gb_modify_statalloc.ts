import type { ComponentsV2Components } from "@/types/seyfert";
import {
  parseGearbuilderComponentsIntoPlayer,
  serializeTopLevelComponent,
} from "@/utils";
import {
  ComponentCommand,
  ComponentContext,
  Label,
  Modal,
  TextDisplay,
  TextInput,
  TextInputStyle,
} from "seyfert";

export default class GearbuilderModifyStatAllocButton extends ComponentCommand {
  componentType = "Button" as const;

  override filter(ctx: ComponentContext<typeof this.componentType>) {
    return ctx.customId === "gb_modify_statalloc";
  }

  async run(ctx: ComponentContext<typeof this.componentType>) {
    const originalMessage = ctx.message;

    const components: ComponentsV2Components = originalMessage.components.map(
      serializeTopLevelComponent
    );

    const player = await parseGearbuilderComponentsIntoPlayer(components);

    const pointsText = new TextDisplay()
      .setId(1)
      .setContent(
        `You have ${player.level * 2} points to spend.\nThis action will revert any changes you have made to the magics/fighting styles section.`
      );

    const spiritInput = new TextInput()
      .setCustomId("gb_select_statalloc_spirit")
      .setStyle(TextInputStyle.Short)
      .setLength({ max: 3, min: 1 });

    const spiritLabel = new Label()
      .setLabel("Points in Spirit")
      .setComponent(spiritInput);

    const magicInput = new TextInput()
      .setCustomId("gb_select_statalloc_magic")
      .setStyle(TextInputStyle.Short)
      .setLength({ max: 3, min: 1 });

    const magicLabel = new Label()
      .setLabel("Points in Magic")
      .setComponent(magicInput);

    const strengthInput = new TextInput()
      .setCustomId("gb_select_statalloc_strength")
      .setStyle(TextInputStyle.Short)
      .setLength({ max: 3, min: 1 });

    const strengthLabel = new Label()
      .setLabel("Points in Strength")
      .setComponent(strengthInput);

    const weaponInput = new TextInput()
      .setCustomId("gb_select_statalloc_weapon")
      .setStyle(TextInputStyle.Short)
      .setLength({ max: 3, min: 1 });

    const weaponLabel = new Label()
      .setLabel("Points in Weapon")
      .setComponent(weaponInput);

    const originalMessageId = ctx.message.id;

    const modal = new Modal()
      .setTitle("Stat Allocation")
      .setCustomId(`gb_select_statalloc_${originalMessageId}`)
      .addComponents([
        pointsText,
        spiritLabel,
        magicLabel,
        strengthLabel,
        weaponLabel,
      ]);

    await ctx.interaction.modal(modal);
  }
}
