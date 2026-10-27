import { Database } from "bun:sqlite";
import {
  fetchLeaderboard,
  type LeaderboardSnapshot,
  type LeaderboardType,
} from "../utils/leaderboard";

const HISTORY_RETENTION_MS = 8 * 24 * 60 * 60 * 1000;
const database = new Database("./data/leaderboard-history.sqlite");

database.run(`
  CREATE TABLE IF NOT EXISTS leaderboard_snapshots (
    type TEXT NOT NULL,
    updated_at INTEGER NOT NULL,
    entries TEXT NOT NULL,
    PRIMARY KEY (type, updated_at)
  )
`);

const insertSnapshot = database.prepare(
  `INSERT OR IGNORE INTO leaderboard_snapshots (type, updated_at, entries)
   VALUES (?, ?, ?)`
);
const pruneSnapshots = database.prepare(
  "DELETE FROM leaderboard_snapshots WHERE updated_at < ?"
);
const getSnapshots = database.prepare(
  `SELECT updated_at, entries FROM leaderboard_snapshots
   WHERE type = ? ORDER BY updated_at DESC LIMIT 200`
);

export async function captureLeaderboardSnapshot(
  type: LeaderboardType
): Promise<boolean> {
  const snapshot = await fetchLeaderboard(type);
  const result = insertSnapshot.run(
    type,
    snapshot.updatedAt,
    JSON.stringify(snapshot.entries)
  );
  pruneSnapshots.run(Date.now() - HISTORY_RETENTION_MS);
  return result.changes > 0;
}

export function getLeaderboardSnapshots(
  type: LeaderboardType
): LeaderboardSnapshot[] {
  return getSnapshots.all(type).map((row) => {
    const snapshot = row as { updated_at: number; entries: string };
    return {
      updatedAt: snapshot.updated_at,
      entries: JSON.parse(snapshot.entries) as LeaderboardSnapshot["entries"],
    };
  });
}
