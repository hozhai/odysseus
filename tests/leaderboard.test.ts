import { describe, expect, test } from "bun:test";
import { parseLeaderboardHtml } from "../src/utils/leaderboard";
import { getLeaderboardGains } from "../src/utils/leaderboard-diff";

const leaderboardHtml = `
  <p>Last Updated: Mon Oct 26 2026 10:11:12 GMT+0000</p>
  <span data-slot="badge">#1</span>
  <div class="font-semibold text-lg">A &amp; B</div>
  <div class="text-2xl font-bold text-primary">1,234</div>
  <div class="text-sm text-muted-foreground">Infamy</div>
  <span data-slot="badge">#2</span>
  <div class="font-semibold text-lg">Second Clan</div>
  <div class="text-2xl font-bold text-primary">900</div>
  <div class="text-sm text-muted-foreground">Infamy</div>
`;

describe("parseLeaderboardHtml", () => {
  test("parses timestamp, ranks, scores, and HTML entities", () => {
    const snapshot = parseLeaderboardHtml(leaderboardHtml, "clan");

    expect(snapshot.updatedAt).toBe(
      Date.parse("Mon Oct 26 2026 10:11:12 GMT+0000")
    );
    expect(snapshot.entries).toEqual([
      { position: 1, name: "A & B", score: 1234, metric: "Infamy" },
      { position: 2, name: "Second Clan", score: 900, metric: "Infamy" },
    ]);
  });

  test("rejects a missing or unparseable update timestamp", () => {
    expect(() =>
      parseLeaderboardHtml("<p>No leaderboard data</p>", "clan")
    ).toThrow("timestamp could not be parsed");
  });

  test("rejects pages with no valid entries for the selected leaderboard", () => {
    const guildHtml = leaderboardHtml.replaceAll("Infamy", "Reputation");
    expect(() => parseLeaderboardHtml(leaderboardHtml, "guild")).toThrow(
      "No guilds leaderboard entries found"
    );
    expect(parseLeaderboardHtml(guildHtml, "guild").entries).toHaveLength(2);
  });
});

describe("getLeaderboardGains", () => {
  test("matches names case-insensitively and reports nonnegative gains", () => {
    const gains = getLeaderboardGains(
      [
        { position: 1, name: "Alpha", score: 150, metric: "Infamy" },
        { position: 2, name: "Beta", score: 80, metric: "Infamy" },
      ],
      [
        { position: 3, name: "alpha", score: 100, metric: "Infamy" },
        { position: 2, name: "Beta", score: 100, metric: "Infamy" },
      ]
    );

    expect(gains.map(({ entry, gained }) => [entry.name, gained])).toEqual([
      ["Alpha", 50],
      ["Beta", 0],
    ]);
  });

  test("ignores names that are duplicated in either snapshot", () => {
    const repeated = {
      position: 1,
      name: "Alpha",
      score: 100,
      metric: "Infamy",
    };

    expect(
      getLeaderboardGains([repeated, { ...repeated, position: 2 }], [repeated])
    ).toEqual([]);
  });
});
