import {
  Declare,
  Command,
  type CommandContext,
  Embed,
  type APIEmbedField,
  Formatter,
} from "seyfert";
import { EMBED_COLOR_DEFAULT, EMBED_FOOTER } from "../constants";

@Declare({
  name: "help",
  description: "Displays Odysseus' commands.",
})
export default class AboutCommand extends Command {
  override async run(ctx: CommandContext) {
    const commands: Command[] = (await Bun.file(
      "./commands.json"
    ).json()) as Command[];

    const fields: APIEmbedField[] = [];

    commands.forEach((command) => {
      fields.push({ name: command.name, value: command.description });
    });

    const embed = new Embed()
      .setAuthor({
        name: ctx.author.username,
        iconUrl: ctx.author.avatarURL(),
      })
      .setTitle(`Help`)
      .setDescription(
        `
        If you need help regarding ${Formatter.userMention(ctx.client.applicationId)}, check out our [Discord](https://discord.gg/Z3uKnGHvMN)!
        `
      )
      .setFields(fields)
      .setColor(EMBED_COLOR_DEFAULT)
      .setFooter({ text: EMBED_FOOTER });

    await ctx.write({
      embeds: [embed],
    });
  }
}
