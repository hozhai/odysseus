import {
  Declare,
  Command,
  type CommandContext,
  Embed,
  createStringOption,
  Options,
} from "seyfert";
import { EMBED_COLOR_DEFAULT, EMBED_FOOTER } from "../constants";
import { createPagination } from "../utils/pagination";
import {
  fetchLeaderboard,
  type LeaderboardEntry,
  type LeaderboardType,
} from "../utils/leaderboard";

const options = {
  name: createStringOption({
    description: "Choose clans or guilds. Defaults to clans.",
    required: false,
    choices: [
      { name: "Clans", value: "clan" },
      { name: "Guilds", value: "guild" },
    ],
  }),
};

@Declare({
  name: "leaderboard",
  description: "Displays the leaderboard for clans or guilds.",
})
@Options(options)
export default class LeaderBoardCommand extends Command {
  override async run(ctx: CommandContext<typeof options>) {
    const type = (ctx.options.name ?? "clan") as LeaderboardType;
    const isGuild = type === "guild";
    const title = isGuild ? "Guilds" : "Clans";
    const expectedMetric = isGuild ? "Reputation" : "Infamy";
    let entries: LeaderboardEntry[];

    try {
      entries = (await fetchLeaderboard(type)).entries;
    } catch (error) {
      ctx.client.logger.error(
        `Failed to load the ${title.toLowerCase()} leaderboard:`,
        error
      );
      await ctx.write({
        content: `Unable to load the ${title.toLowerCase()} leaderboard right now. Please try again later.`,
      });
      return;
    }

    const entriesPerPage = 10;
    const pages: Embed[] = [];

    for (let start = 0; start < entries.length; start += entriesPerPage) {
      const pageEntries = entries.slice(start, start + entriesPerPage);
      const pageNumber = pages.length + 1;

      pages.push(
        new Embed()
          .setAuthor({
            name: ctx.author.username,
            iconUrl: ctx.author.avatarURL(),
          })
          .setTitle(`Top ${title} Leaderboard`)
          .setDescription(`Ranked by ${expectedMetric}.`)
          .setColor(EMBED_COLOR_DEFAULT)
          .setFields(
            pageEntries.map((entry) => ({
              name: `#${entry.position} ${entry.name}`,
              value: `${entry.score.toLocaleString("en-US")} ${entry.metric}`,
            }))
          )
          .setFooter({
            text: `${EMBED_FOOTER} | Page ${pageNumber}`,
          })
      );
    }

    await createPagination({ ctx, pages });
  }
}
