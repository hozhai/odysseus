export type LeaderboardType = "clan" | "guild";

export interface LeaderboardEntry {
  position: number;
  name: string;
  score: number;
  metric: string;
}

export interface LeaderboardSnapshot {
  updatedAt: number;
  entries: LeaderboardEntry[];
}

export async function fetchLeaderboard(
  type: LeaderboardType
): Promise<LeaderboardSnapshot> {
  const isGuild = type === "guild";
  const title = isGuild ? "Guilds" : "Clans";
  const expectedMetric = isGuild ? "Reputation" : "Infamy";
  const response = await fetch(
    `https://leaderboards.arcaneodyssey.dev/${type}s`,
    { signal: AbortSignal.timeout(15_000) }
  );

  if (!response.ok) {
    throw new Error(
      `${title} leaderboard request failed with status ${response.status}.`
    );
  }

  const html = await response.text();
  const updatedAt = parseUpdatedAt(html);
  const entries = parseLeaderboard(html, expectedMetric);

  if (!entries.length) {
    throw new Error(`No ${title.toLowerCase()} leaderboard entries found.`);
  }

  return { updatedAt, entries };
}

function parseUpdatedAt(html: string): number {
  const text = htmlToText(html);
  const match = text.match(
    /Last Updated:\s*((?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s+[A-Z][a-z]{2}\s+\d{1,2}\s+\d{4}\s+\d{2}:\d{2}:\d{2}\s+GMT[+-]\d{4}(?:\s+\([^)]*\))?)/i
  );
  const updatedAt = match?.[1] ? Date.parse(match[1]) : Number.NaN;

  if (!Number.isFinite(updatedAt)) {
    throw new Error("The leaderboard update timestamp could not be parsed.");
  }

  return updatedAt;
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
    const scoreText = htmlToText(match[3] ?? "");
    const score = Number(scoreText.replaceAll(",", ""));
    const metric = htmlToText(match[4] ?? "");

    if (
      !Number.isSafeInteger(position) ||
      !name ||
      !/^\d[\d,]*$/.test(scoreText) ||
      !Number.isSafeInteger(score) ||
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
