# Privacy Policy - Odysseus Discord Bot

**Last Updated:** November 4, 2026

## 1. Introduction

This Privacy Policy describes how Odysseus ("the Bot") handles information when
you use it on Discord. It describes behavior implemented in the public source
code. The Bot's hosting provider, Discord, and other services may have their
own data practices that are outside this repository.

## 2. Information Processed by the Bot

### 2.1 Discord Interactions

Discord sends interaction data to the Bot when you use a command or component.
The Bot uses information available in an interaction, such as your Discord user
ID, username, avatar, and the relevant server, channel, or command inputs, to
respond and operate interactive controls. This information is processed to
provide the requested feature.

The source code does not implement a database of command history or command
usage analytics. It does write operational log messages, including startup and
data-loading details, leaderboard snapshot events, and errors. The Bot's host
may retain process or infrastructure logs according to its own configuration.

### 2.2 Command Inputs and External Requests

Most item, weapon, magic, and sorting features use game data shipped with the
Bot. Wiki searches send the search query to the Arcane Odyssey Fandom wiki.
Leaderboard features retrieve publicly available clan and guild leaderboard
pages from `leaderboards.arcaneodyssey.dev`. The Bot does not include your
Discord user ID in those requests; the external services may receive ordinary
network request metadata.

The `/build` command currently responds that it is under construction and
returns before parsing the submitted build URL.

### 2.3 Persistent Leaderboard History

The Bot stores snapshots of public clan and guild leaderboards in a local
SQLite database at `./data/leaderboard-history.sqlite`. A snapshot can include
leaderboard entry names, positions, scores, metric labels, the source update
time, and the time the Bot captured the snapshot. The database does not store
Discord user IDs, server IDs, or command history.

The Bot polls for leaderboard changes every five minutes and removes snapshots
older than eight days. The database is stored on the Bot host's filesystem; its
actual location, backups, and any host-level retention depend on the deployment.

## 3. How Information Is Used

Information processed by the Bot is used to:

- Respond to commands and component interactions
- Provide item, weapon, magic, wiki, and leaderboard features
- Maintain the short-lived public leaderboard history used by leaderboard
  comparisons
- Diagnose operational errors through logs

The source code does not implement advertising, sale of user data, profiling,
or command-usage analytics.

## 4. Third-Party Services

The Bot uses Discord to receive interactions and send responses. It also
requests wiki search results from the Arcane Odyssey Fandom wiki and public
leaderboard pages from `leaderboards.arcaneodyssey.dev`. These services are
subject to their own terms and privacy practices. The Bot's source code cannot
describe their independent collection, processing, or retention.

## 5. Storage, Retention, and Security

The leaderboard history described above is retained for up to eight days by the
Bot's pruning logic. The repository does not establish how the Bot host handles
backups, infrastructure logs, access controls, or server location, so those
details may differ by deployment. Discord also processes data under its own
policies.

No separate persistent database of Discord users or command history is
implemented in the source code. Operational logs and data held by Discord,
external services, or the hosting provider may be subject to their respective
retention practices.

## 6. Your Choices and Requests

You can stop using the Bot or remove it from a server you manage. The
leaderboard-history database contains public game leaderboard data rather than
records associated with Discord users, so it does not provide a user-specific
command-history record to delete.

For privacy questions, contact the project through
[GitHub](https://github.com/hozhai/odysseus). GitHub issues are public; do not
include sensitive personal information in a public issue.

## 7. Children's Privacy

Use of the Bot is subject to Discord's minimum-age requirements and applicable
law. The source code does not implement age verification.

## 8. Changes to This Policy

This policy may be updated when the Bot's behavior or data practices change.
Updates will be posted here with a revised date. Please review it periodically.

## 9. Open Source

The Bot's source code is available in the
[public repository](https://github.com/hozhai/odysseus), where its implemented
data handling can be reviewed. Deployment and third-party practices are not
fully determined by the source code.

---

For the most current version of this Privacy Policy, visit:
[PrivacyPolicy.md](https://github.com/hozhai/odysseus/blob/main/PrivacyPolicy.md).
