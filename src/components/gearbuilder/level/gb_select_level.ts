import { MAX_LEVEL_PLAYER } from "@/constants";
import type { ComponentsV2Components } from "@/types/seyfert";
import {
  MagicsEnum,
  parseGearbuilderComponentsIntoPlayer,
  parsePlayerIntoGearbuilderComponents,
  serializeTopLevelComponent,
} from "@/utils";
import {
  ActionRow,
  Button,
  ButtonStyle,
  MessageFlags,
  ModalCommand,
  type ModalContext,
} from "seyfert";

export default class GearbuilderSelectLevelModal extends ModalCommand {
  override filter(ctx: ModalContext) {
    return ctx.customId.startsWith("gb_select_level_");
  }

  async run(ctx: ModalContext) {
    const originalMessageId = ctx.customId.slice("gb_select_level_".length);

    if (!originalMessageId) {
      await ctx.write({
        content: "Could not identify the original Gearbuilder message.",
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

    const level = Number(ctx.getInputValue("gb_select_level_level", true));

    const retryRow = new ActionRow();

    retryRow.addComponents(
      new Button()
        .setLabel("Retry")
        .setStyle(ButtonStyle.Danger)
        .setCustomId("gb_modify_statalloc")
    );

    if (!Number.isInteger(level)) {
      await ctx.write({
        content: "Invalid input for level. Retry?",
        components: [retryRow],
      });
      return;
    }

    if (level > MAX_LEVEL_PLAYER) {
      await ctx.write({
        content: `Input for level exceeds \`MAX_LEVEL_PLAYER\` (Your input: ${level} - MAX_LEVEL_PLAYER: ${MAX_LEVEL_PLAYER}). Retry?`,
        components: [retryRow],
      });
      return;
    }

    if (level < 1) {
      await ctx.write({
        content: "Input is invalid (below 1). Retry?",
        components: [retryRow],
      });
      return;
    }

    const newPlayer = { ...player };

    newPlayer.level = level;

    // reset stat allocations to defaults
    newPlayer.vitalityPoints = 0;
    newPlayer.magicPoints = 0;
    newPlayer.strengthPoints = 0;
    newPlayer.weaponPoints = 0;

    // reset magics/fs to acid ONLY (default)
    newPlayer.magics = [MagicsEnum.Acid];
    newPlayer.fightingStyles = [];

    const newComponents = await parsePlayerIntoGearbuilderComponents(
      newPlayer,
      ctx.author.username
    );

    await originalMessage.edit({
      components: [newComponents],
      flags: MessageFlags.IsComponentsV2,
    });

    await ctx.write({
      content: `Succesfully wrote level: ${level}`,
    });

    await ctx.deleteResponse();
  }
}
