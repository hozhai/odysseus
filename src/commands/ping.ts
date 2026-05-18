import {
  Declare,
  Options,
  Command,
  type CommandContext,
  createBooleanOption,
  IgnoreCommand,
  Embed,
} from "seyfert";
import { EMBED_COLOR_DEFAULT, EMBED_FOOTER } from "../constants";

const options = {
  hide: createBooleanOption({
    description: "Whether to make the response ephemeral",
  }),
};

@Declare({
  name: "ping",
  description: "Returns the API latency",
})
@Options(options)
export default class PingCommand extends Command {
  override async run(ctx: CommandContext) {
    const ping = ctx.client.gateway.latency;

    const embed = new Embed()
      .setAuthor({
        name: ctx.author.username,
        iconUrl: ctx.author.avatarURL(),
      })
      .setDescription(`The latency is \`${ping}ms\``)
      .setColor(EMBED_COLOR_DEFAULT)
      .setFooter({ text: EMBED_FOOTER });

    await ctx.write({
      embeds: [embed],
    });
  }
}
