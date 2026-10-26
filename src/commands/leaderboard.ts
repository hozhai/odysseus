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
    const type = ctx.options.name ?? "clan";
    const isGuild = type === "guild";
    const title = isGuild ? "Guilds" : "Clans";
    const expectedMetric = isGuild ? "Reputation" : "Infamy";
    let entries: LeaderboardEntry[];

    try {
      const response = await fetch(
        `https://leaderboards.arcaneodyssey.dev/${type}s`,
        { signal: AbortSignal.timeout(15_000) }
      );

      if (!response.ok) {
        throw new Error(
          `Leaderboard request failed with status ${response.status}.`
        );
      }

      const html = await response.text();
      entries = parseLeaderboard(html, expectedMetric);
      if (!entries.length) {
        throw new Error("No leaderboard entries were found in the response.");
      }
    } catch (error) {
      console.error(
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
          .setTitle(`Top ${title} Leaderboard`)
          .setDescription(`Ranked by ${expectedMetric}.`)
          .setColor(EMBED_COLOR_DEFAULT)
          .setFields(
            pageEntries.map((entry) => ({
              name: `#${entry.position} ${entry.name}`,
              value: `${entry.score} ${entry.metric}`,
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

interface LeaderboardEntry {
  position: number;
  name: string;
  score: string;
  metric: string;
}

function parseLeaderboard(
  html: string,
  expectedMetric: string
): LeaderboardEntry[] {
  const entryPattern =
    /<span\b[^>]*data-slot="badge"[^>]*>\s*#(?:<!--[\s\S]*?-->)?\s*(\d+)\s*<\/span>[\s\S]*?<div\b[^>]*class="font-semibold text-lg">([\s\S]*?)<\/div>[\s\S]*?<div\b[^>]*class="text-2xl font-bold text-primary">([\s\S]*?)<\/div>[\s\S]*?<div\b[^>]*class="text-sm text-muted-foreground">([^<]+)<\/div>/g;
  const entries: LeaderboardEntry[] = [];

  for (const match of html.matchAll(entryPattern)) {
    const position = Number(match[1]);
    const name = htmlToText(match[2] ?? "");
    const score = htmlToText(match[3] ?? "");
    const metric = htmlToText(match[4] ?? "");

    if (
      !Number.isSafeInteger(position) ||
      !name ||
      !/^\d[\d,]*$/.test(score) ||
      metric !== expectedMetric
    ) {
      continue;
    }

    entries.push({ position, name, score, metric });
  }

  return entries;
}

function htmlToText(value: string): string {
  return value
    .replace(/<[^>]*>/g, "")
    .replace(
      /&(#(?:x[\da-f]+|\d+)|amp|lt|gt|quot|apos|nbsp);/gi,
      (entity, code: string) => {
        switch (code.toLowerCase()) {
          case "amp":
            return "&";
          case "lt":
            return "<";
          case "gt":
            return ">";
          case "quot":
            return '"';
          case "apos":
            return "'";
          case "nbsp":
            return " ";
          default: {
            const characterCode =
              code[1]?.toLowerCase() === "x"
                ? Number.parseInt(code.slice(2), 16)
                : Number.parseInt(code.slice(1), 10);
            return Number.isInteger(characterCode) &&
              characterCode >= 0 &&
              characterCode <= 0x10ffff
              ? String.fromCodePoint(characterCode)
              : entity;
          }
        }
      }
    )
    .replace(/\s+/g, " ")
    .trim();
}
