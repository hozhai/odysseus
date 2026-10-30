import {
  Declare,
  Command,
  type CommandContext,
  Embed,
  ActionRow,
  Button,
  Formatter,
} from "seyfert";
import { EMBED_COLOR_DEFAULT, EMBED_FOOTER, VERSION } from "../constants";
import { ButtonStyle } from "seyfert/lib/types";
import { formatSeconds } from "../utils/misc";

@Declare({
  name: "about",
  description: "Displays the about page for Odysseus.",
})
export default class AboutCommand extends Command {
  override async run(ctx: CommandContext) {
    const ping = ctx.client.gateway.latency;
    const uptimeHours = formatSeconds(Bun.nanoseconds() / 1e9);
    const memoryUsed = process.memoryUsage().rss / 1024 / 1024;

    const embed = new Embed()
      .setAuthor({
        name: ctx.author.username,
        iconUrl: ctx.author.avatarURL(),
      })
      .setTitle(`About Odysseus v${VERSION}`)
      .setDescription(
        `
        Odysseus is a utility bot for Arcane Odyssey, a Roblox game where you embark through an epic journey through the War Seas. 
        
        This is a side project by ${Formatter.userMention("360235359746916352")} and used to be an excuse to learn Go and Rust, but is now an excuse to further my knowledge of TypeScript and the Bun runtime.

        Get started by running \`/help\`!
       `
      )
      .setFields([
        {
          name: "Bot Latency",
          value: `\`${ping}ms\``,
          inline: true,
        },
        {
          name: "Process Uptime",
          value: `\`${uptimeHours}\``,
          inline: true,
        },
        {
          name: "Memory Usage (RSS)",
          value: `\`${memoryUsed.toFixed(2)}\` MB`,
        },
      ])
      .setImage(
        "https://raw.githubusercontent.com/hozhai/odysseus/refs/heads/main/assets/banner.webp"
      )
      .setColor(EMBED_COLOR_DEFAULT)
      .setFooter({ text: EMBED_FOOTER });

    const row = new ActionRow().setComponents([
      new Button()
        .setURL("https://github.com/hozhai/odysseus")
        .setLabel("Source Code")
        .setStyle(ButtonStyle.Link),
      new Button()
        .setURL("https://discord.gg/Z3uKnGHvMN")
        .setLabel("Discord Server")
        .setStyle(ButtonStyle.Link),
      new Button()
        .setURL("https://ko-fi.com/khzhai")
        .setLabel("Ko-fi")
        .setStyle(ButtonStyle.Link),
    ]);

    await ctx.write({
      embeds: [embed],
      components: [row],
    });
  }
}
