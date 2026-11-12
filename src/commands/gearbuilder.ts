import { EMBED_FOOTER } from "@/constants";
import { getEmojis } from "@/data";
import {
  createEmptyPlayer,
  parsePlayerIntoEmbed,
  parsePlayerIntoGearbuilderComponents,
} from "@/utils";
import {
  Declare,
  Command,
  type CommandContext,
  MessageFlags,
  Container,
  TextDisplay,
  Section,
  Separator,
  Button,
  ButtonStyle,
  Formatter,
  ActionRow,
} from "seyfert";

@Declare({
  name: "gearbuilder",
  description: "Allows you to create a build.",
})
export default class GearbuilderCommand extends Command {
  override async run(ctx: CommandContext) {
    const player = createEmptyPlayer();
    const component = await parsePlayerIntoGearbuilderComponents(
      player,
      ctx.author.username
    );

    await ctx.write({
      components: [component],
      flags: MessageFlags.IsComponentsV2,
    });
  }
}
