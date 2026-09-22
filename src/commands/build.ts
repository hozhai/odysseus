import {
  Command,
  CommandContext,
  createBooleanOption,
  createStringOption,
  Declare,
  Embed,
  Options,
} from "seyfert";
import {
  BUILD_URL_PREFIX_BOBBY,
  BUILD_URL_PREFIX_WOODY,
  EMBED_COLOR_ERROR,
} from "../constants";
import { parsePlayerIntoEmbed, unhashBuildCode } from "../utils/build";
import { MessageFlags } from "seyfert/lib/types";

const options = {
  url: createStringOption({
    description: "URL of the GearBuilder link",
    required: true,
  }),
  gatekeep: createBooleanOption({
    description: "Whether to gatekeep this build - defaults to false",
    required: false,
  }),
};

@Declare({
  name: "build",
  description: "Displays a build from a GearBuilder-type link.",
})
@Options(options)
export default class ItemCommand extends Command {
  override async run(ctx: CommandContext<typeof options>) {
    const url = ctx.options.url;
    const gatekeep = ctx.options.gatekeep ?? false;

    if (gatekeep) {
      await ctx.deferReply(true);
    } else {
      await ctx.deferReply(false);
    }

    // validate URL
    if (
      !url.startsWith(BUILD_URL_PREFIX_BOBBY) &&
      !url.startsWith(BUILD_URL_PREFIX_WOODY)
    ) {
      const embed = new Embed()
        .setAuthor({
          name: ctx.author.username,
          iconUrl: ctx.author.avatarURL(),
        })
        .setTitle("Invalid GearBuilder link")
        .setDescription(
          `
          Make sure the link starts with either:
          \`${BUILD_URL_PREFIX_BOBBY}\`
          or
          \`${BUILD_URL_PREFIX_WOODY}\`
          and try again.
          `
        )
        .setColor(EMBED_COLOR_ERROR);

      await ctx.write({ embeds: [embed] });
      return;
    }

    const player = unhashBuildCode(url.split("#")[1]!);

    if (gatekeep) {
      await ctx.client.messages.write(ctx.channelId, {
        content: JSON.stringify(player, null, 2),
      });
      await ctx.write({
        content: "Succesfully sent gatekept build!",
        flags: MessageFlags.Ephemeral,
      });
    }

    await ctx.write({ embeds: [parsePlayerIntoEmbed(ctx, player)] });
  }
}
