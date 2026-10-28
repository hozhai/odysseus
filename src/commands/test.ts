import { Declare, Command, type CommandContext, Embed } from "seyfert";
import { EMBED_COLOR_DEFAULT, EMBED_FOOTER } from "../constants";
import type { EmojiResolvable } from "seyfert/lib/common";

@Declare({
  name: "test",
  description: "Miscellaneous testing stuff.",
})
export default class AboutCommand extends Command {
  override async run(ctx: CommandContext) {
    if (ctx.author.id !== "360235359746916352") {
      await ctx.write({
        content: "You do not have permission to use this command.",
      });

      return;
    }

    const hi: EmojiResolvable = {
      name: "a",
      id: "a",
    };

    const embed = new Embed()
      .setAuthor({
        name: ctx.author.username,
        iconUrl: ctx.author.avatarURL(),
      })
      .setTitle(`Test`)
      .setDescription(
        `
        \`\`\`${typeof hi}\`\`\`
        `
      )
      .setColor(EMBED_COLOR_DEFAULT)
      .setFooter({ text: EMBED_FOOTER });

    await ctx.write({
      embeds: [embed],
    });
  }
}
