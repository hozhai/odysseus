import {
  Command,
  type CommandContext,
  createStringOption,
  Declare,
  Embed,
  Options,
} from "seyfert";
import { getLeaderboardSnapshots } from "../data/leaderboardHistory";
import { EMBED_COLOR_DEFAULT, EMBED_FOOTER } from "../constants";
import type {
  LeaderboardEntry,
  LeaderboardSnapshot,
  LeaderboardType,
} from "../utils/leaderboard";

const options = {
  type: createStringOption({
    description: "Choose clans or guilds.",
    required: true,
    choices: [
      { name: "Infamy", value: "clan" },
      { name: "Reputation", value: "guild" },
    ],
  }),
};

const periods = [
  { label: "Past 1 hour", durationMs: 60 * 60 * 1000 },
  { label: "Past 24 hours", durationMs: 24 * 60 * 60 * 1000 },
  { label: "Past week", durationMs: 7 * 24 * 60 * 60 * 1000 },
] as const;
const MAX_ONE_HOUR_BASELINE_DRIFT_MS = 5 * 60 * 1000;

@Declare({
  name: "leaderboard-diff",
  description:
    "Shows infamy or reputation gains over the past hour, day, and week.",
})
@Options(options)
export default class LeaderboardDiffCommand extends Command {
  override async run(ctx: CommandContext<typeof options>) {
    const type = ctx.options.type as LeaderboardType;
    const metric = type === "guild" ? "Reputation" : "Infamy";
    const snapshots = getLeaderboardSnapshots(type);
    const current = snapshots[0];

    if (!current) {
      await ctx.write({
        content:
          "No leaderboard history is available yet. Please try again after the next leaderboard update.",
      });
      return;
    }

    const fields = periods.map(({ label, durationMs }) => ({
      name: label,
      value: createPeriodValue(snapshots, current, durationMs, metric),
    }));

    const embed = new Embed()
      .setAuthor({
        name: ctx.author.username,
        iconUrl: ctx.author.avatarURL(),
      })
      .setTitle(`${type === "guild" ? "Guild" : "Clan"} ${metric} Gains`)
      .setDescription(
        `Last updated: <t:${Math.floor(current.updatedAt / 1000)}:R>. Only gains are shown.`
      )
      .setColor(EMBED_COLOR_DEFAULT)
      .setFields(fields)
      .setFooter({ text: EMBED_FOOTER });

    await ctx.write({ embeds: [embed] });
  }
}

function createPeriodValue(
  snapshots: LeaderboardSnapshot[],
  current: LeaderboardSnapshot,
  durationMs: number,
  metric: string
): string {
  const currentTime = current.capturedAt ?? current.updatedAt;
  const baselineTime = currentTime - durationMs;
  const isOneHourPeriod = durationMs === periods[0].durationMs;
  const exactBaseline = isOneHourPeriod
    ? undefined
    : snapshots.find(
        (snapshot) =>
          (snapshot.capturedAt ?? snapshot.updatedAt) <= baselineTime
      );
  const baseline = isOneHourPeriod
    ? findOneHourBaseline(snapshots, baselineTime)
    : (exactBaseline ?? snapshots.at(-1));
  const isPartialHistory = !isOneHourPeriod && !exactBaseline;

  if (!baseline) {
    return "Not enough snapshot history yet.";
  }

  const diffs = getGains(current.entries, baseline.entries);
  const positiveGains = diffs
    .filter(({ gained }) => gained > 0)
    .sort((left, right) => right.gained - left.gained);

  if (!positiveGains.length) {
    return isPartialHistory
      ? `No gains recorded in available history since <t:${Math.floor((baseline.capturedAt ?? baseline.updatedAt) / 1000)}:R>.`
      : "No gains recorded.";
  }

  const gainLines = positiveGains.map(
    ({ entry, gained }) =>
      `#${entry.position} ${entry.name} > +${gained.toLocaleString("en-US")} ${metric}`
  );
  if (isPartialHistory) {
    gainLines.unshift(
      `Available history since <t:${Math.floor((baseline.capturedAt ?? baseline.updatedAt) / 1000)}:R>:`
    );
  }
  return fitFieldValue(gainLines);
}

function findOneHourBaseline(
  snapshots: LeaderboardSnapshot[],
  baselineTime: number
): LeaderboardSnapshot | undefined {
  let baseline: LeaderboardSnapshot | undefined;
  let closestDistance = Number.POSITIVE_INFINITY;

  for (const snapshot of snapshots.slice(1)) {
    const snapshotTime = snapshot.capturedAt ?? snapshot.updatedAt;
    const distance = Math.abs(snapshotTime - baselineTime);
    if (distance < closestDistance) {
      baseline = snapshot;
      closestDistance = distance;
    }
  }

  return closestDistance <= MAX_ONE_HOUR_BASELINE_DRIFT_MS
    ? baseline
    : undefined;
}

function getGains(
  currentEntries: LeaderboardEntry[],
  baselineEntries: LeaderboardEntry[]
): { entry: LeaderboardEntry; gained: number }[] {
  const currentByName = groupByName(currentEntries);
  const baselineByName = groupByName(baselineEntries);
  const gains: { entry: LeaderboardEntry; gained: number }[] = [];

  for (const [name, currentMatches] of currentByName) {
    const baselineMatches = baselineByName.get(name);
    if (currentMatches.length !== 1 || baselineMatches?.length !== 1) {
      continue;
    }

    const entry = currentMatches[0]!;
    const baselineEntry = baselineMatches[0]!;
    gains.push({
      entry,
      gained: Math.max(0, entry.score - baselineEntry.score),
    });
  }

  return gains;
}

function groupByName(
  entries: LeaderboardEntry[]
): Map<string, LeaderboardEntry[]> {
  const grouped = new Map<string, LeaderboardEntry[]>();
  for (const entry of entries) {
    const key = entry.name.toLocaleLowerCase();
    const matches = grouped.get(key) ?? [];
    matches.push(entry);
    grouped.set(key, matches);
  }
  return grouped;
}

function fitFieldValue(lines: string[]): string {
  const maxLength = 1024;
  const included: string[] = [];
  let omitted = false;

  for (const line of lines) {
    const nextLength =
      included.reduce((length, value) => length + value.length + 1, 0) +
      line.length;
    if (nextLength <= maxLength) {
      included.push(line);
    } else {
      omitted = true;
      break;
    }
  }

  if (omitted) {
    while (
      included.length &&
      included.reduce((length, value) => length + value.length + 1, 0) + 3 >
        maxLength
    ) {
      included.pop();
    }
    included.push("...");
  }

  return included.join("\n");
}
