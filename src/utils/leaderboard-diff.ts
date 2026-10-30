import type { LeaderboardEntry } from "./leaderboard";

export function getLeaderboardGains(
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
