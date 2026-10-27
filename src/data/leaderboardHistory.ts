import { Database } from "bun:sqlite";
import {
  fetchLeaderboard,
  type LeaderboardSnapshot,
  type LeaderboardType,
} from "../utils/leaderboard";

const HISTORY_RETENTION_MS = 8 * 24 * 60 * 60 * 1000; // 8 days
const MAX_SNAPSHOTS = 2500;
const database = new Database("./data/leaderboard-history.sqlite");

database.run(`
  CREATE TABLE IF NOT EXISTS leaderboard_snapshots (
    type TEXT NOT NULL,
    updated_at INTEGER NOT NULL,
    entries TEXT NOT NULL,
    PRIMARY KEY (type, updated_at)
  )
`);

database.run(`
  CREATE TABLE IF NOT EXISTS leaderboard_observations (
    type TEXT NOT NULL,
    captured_at INTEGER NOT NULL,
    source_updated_at INTEGER NOT NULL,
    entries TEXT NOT NULL,
    PRIMARY KEY (type, captured_at)
  )
`);

database.run(`
  INSERT OR IGNORE INTO leaderboard_observations
    (type, captured_at, source_updated_at, entries)
  SELECT type, updated_at, updated_at, entries
  FROM leaderboard_snapshots
`);

const insertObservation = database.prepare(
  `INSERT OR IGNORE INTO leaderboard_observations
    (type, captured_at, source_updated_at, entries)
   VALUES (?, ?, ?, ?)`
);
const getLatestSourceUpdate = database.prepare(
  `SELECT source_updated_at
   FROM leaderboard_observations
   WHERE type = ? ORDER BY captured_at DESC LIMIT 1`
);
const pruneObservations = database.prepare(
  "DELETE FROM leaderboard_observations WHERE captured_at < ?"
);
const pruneLegacySnapshots = database.prepare(
  "DELETE FROM leaderboard_snapshots WHERE updated_at < ?"
);
const getSnapshots = database.prepare(
  `SELECT captured_at, source_updated_at, entries
   FROM leaderboard_observations
   WHERE type = ? ORDER BY captured_at DESC LIMIT ${MAX_SNAPSHOTS}`
);

export async function captureLeaderboardSnapshot(
  type: LeaderboardType
): Promise<boolean> {
  const snapshot = await fetchLeaderboard(type);
  const latest = getLatestSourceUpdate.get(type) as
    | { source_updated_at: number }
    | undefined;
  const retentionCutoff = Date.now() - HISTORY_RETENTION_MS;

  if (latest?.source_updated_at === snapshot.updatedAt) {
    pruneObservations.run(retentionCutoff);
    pruneLegacySnapshots.run(retentionCutoff);
    return false;
  }

  const result = insertObservation.run(
    type,
    Date.now(),
    snapshot.updatedAt,
    JSON.stringify(snapshot.entries)
  );
  pruneObservations.run(retentionCutoff);
  pruneLegacySnapshots.run(retentionCutoff);
  return result.changes > 0;
}

export function getLeaderboardSnapshots(
  type: LeaderboardType
): LeaderboardSnapshot[] {
  return getSnapshots.all(type).map((row) => {
    const snapshot = row as {
      captured_at: number;
      source_updated_at: number;
      entries: string;
    };
    return {
      updatedAt: snapshot.source_updated_at,
      capturedAt: snapshot.captured_at,
      entries: JSON.parse(snapshot.entries) as LeaderboardSnapshot["entries"],
    };
  });
}
