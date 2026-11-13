import {
  calculateStatBuild,
  FightingStylesEnum,
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

export default class GearbuilderSelectStatAllocModal extends ModalCommand {
  override filter(ctx: ModalContext) {
    return ctx.customId.startsWith("gb_select_statalloc_");
  }

  async run(ctx: ModalContext) {
    const originalMessageId = ctx.customId.slice("gb_select_statalloc_".length);

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
    const components = originalMessage.components.map(
      serializeTopLevelComponent
    );
    const player = await parseGearbuilderComponentsIntoPlayer(components);

    const spiritPoints = Number(
      ctx.getInputValue("gb_select_statalloc_spirit", true)
    );
    const magicPoints = Number(
      ctx.getInputValue("gb_select_statalloc_magic", true)
    );
    const strengthPoints = Number(
      ctx.getInputValue("gb_select_statalloc_strength", true)
    );
    const weaponPoints = Number(
      ctx.getInputValue("gb_select_statalloc_weapon", true)
    );

    const retryRow = new ActionRow();

    retryRow.addComponents(
      new Button()
        .setLabel("Retry")
        .setStyle(ButtonStyle.Danger)
        .setCustomId("gb_modify_statalloc")
    );

    if (!Number.isInteger(spiritPoints)) {
      await ctx.write({
        content: "Invalid input for spiritPoints. Retry?",
        components: [retryRow],
      });
      return;
    }

    if (!Number.isInteger(magicPoints)) {
      await ctx.write({
        content: "Invalid input for magicPoints. Retry?",
        components: [retryRow],
      });
      return;
    }

    if (!Number.isInteger(strengthPoints)) {
      await ctx.write({
        content: "Invalid input for strengthPoints. Retry?",
        components: [retryRow],
      });
      return;
    }

    if (!Number.isInteger(weaponPoints)) {
      await ctx.write({
        content: "Invalid input for weaponPoints. Retry?",
        components: [retryRow],
      });
      return;
    }

    // FIXME: delete this
    ctx.client.logger.debug(player.level);

    if (
      spiritPoints + magicPoints + strengthPoints + weaponPoints >
      player.level * 2
    ) {
      await ctx.write({
        content: `Inputs exceeds \`player.level*2\` (${player.level * 2}). Retry?`,
        components: [retryRow],
      });
      return;
    }

    const newPlayer = { ...player };

    newPlayer.vitalityPoints = spiritPoints;
    newPlayer.magicPoints = magicPoints;
    newPlayer.strengthPoints = strengthPoints;
    newPlayer.weaponPoints = weaponPoints;

    const statBuild = calculateStatBuild(
      spiritPoints,
      magicPoints,
      strengthPoints,
      weaponPoints
    );

    // set defaults
    switch (statBuild) {
      case "Oracle":
        newPlayer.magics = [];
        newPlayer.fightingStyles = [];
        break;
      case "Mage":
        newPlayer.magics = [MagicsEnum.Acid, MagicsEnum.Ash];
        newPlayer.fightingStyles = [];
        break;
      case "Berserker":
        newPlayer.magics = [];
        newPlayer.fightingStyles = [
          FightingStylesEnum.BasicCombat,
          FightingStylesEnum.Boxing,
        ];
        break;
      case "Warrior":
        newPlayer.magics = [];
        newPlayer.fightingStyles = [];
        break;
      case "Warlock":
        newPlayer.magics = [MagicsEnum.Acid];
        newPlayer.fightingStyles = [FightingStylesEnum.BasicCombat];
        break;
      case "Conjurer":
        newPlayer.magics = [MagicsEnum.Acid];
        newPlayer.fightingStyles = [];
        break;
      case "Warlord":
        newPlayer.magics = [];
        newPlayer.fightingStyles = [FightingStylesEnum.BasicCombat];
        break;
      case "Paladin":
        newPlayer.magics = [MagicsEnum.Acid];
        newPlayer.fightingStyles = [];
        break;
      case "Juggernaut":
        newPlayer.magics = [];
        newPlayer.fightingStyles = [FightingStylesEnum.BasicCombat];
        break;
      case "Knight":
        newPlayer.magics = [];
        newPlayer.fightingStyles = [];
        break;
      case "Savant":
        newPlayer.magics = [MagicsEnum.Acid];
        newPlayer.fightingStyles = [FightingStylesEnum.BasicCombat];
        break;
    }

    const newComponents = await parsePlayerIntoGearbuilderComponents(
      newPlayer,
      ctx.author.username
    );

    await originalMessage.edit({
      components: [newComponents],
      flags: MessageFlags.IsComponentsV2,
    });

    await ctx.write({
      content: `Succesfully wrote \`SPI: ${spiritPoints} - M: ${magicPoints} - STR: ${strengthPoints} - W: ${weaponPoints}\``,
    });

    await ctx.deleteResponse();
  }
}
