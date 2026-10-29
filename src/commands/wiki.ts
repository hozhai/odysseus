import {
  Declare,
  Command,
  type CommandContext,
  createStringOption,
  Options,
  Embed,
} from "seyfert";
import { EMBED_COLOR_DEFAULT, EMBED_FOOTER, WIKI_URL } from "../constants";
import type { FandomSearchResponse, WikiPageResult } from "../types";

const options = {
  query: createStringOption({
    description: "The query to search for.",
    required: true,
  }),
};

@Declare({
  name: "wiki",
  description: "Searches the wiki for a query.",
})
@Options(options)
export default class WikiCommand extends Command {
  override async run(ctx: CommandContext<typeof options>) {
    await ctx.deferReply();

    const query = ctx.options.query;

    const results = await searchWiki(query);
    const embed = new Embed()
      .setAuthor({
        name: ctx.author.username,
        iconUrl: ctx.author.avatarURL(),
      })
      .setTitle(`Wiki`)
      .setDescription(
        results.length
          ? `Search results for \`${query}\`:`
          : "No results found."
      )
      .setColor(EMBED_COLOR_DEFAULT)
      .setFooter({ text: EMBED_FOOTER });

    if (results.length) {
      embed.setFields(
        results.map(({ title, url }) => ({
          name: title,
          value: `[View](${url})`,
        }))
      );
    }

    await ctx.editResponse({ embeds: [embed] });
  }
}

async function searchWiki(
  query: string,
  limit: number = 7
): Promise<WikiPageResult[]> {
  const searchParams = new URLSearchParams({
    action: "query",
    list: "search",
    srsearch: query,
    srlimit: String(limit),
    srprop: "snippet",
    format: "json",
  });
  const searchUrl = new URL("api.php", WIKI_URL);
  searchUrl.search = searchParams.toString();

  const searchResponse = await fetch(searchUrl, {
    signal: AbortSignal.timeout(15_000),
  });
  if (!searchResponse.ok) {
    throw new Error(`Wiki search failed with status ${searchResponse.status}.`);
  }

  const searchData = (await searchResponse.json()) as FandomSearchResponse;
  const results = searchData.query?.search;
  if (!results) {
    throw new Error("Wiki search response did not contain results.");
  }

  return results.map(({ title }) => ({
    title,
    url: new URL(
      `wiki/${encodeURIComponent(title.replaceAll(" ", "_"))}`,
      WIKI_URL
    ).href,
  }));
}
