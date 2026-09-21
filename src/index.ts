import { Client } from "seyfert";
import { ActivityType, PresenceUpdateStatus } from "seyfert/lib/types";

const client = new Client({
  gateway: {
    properties: {
      os: "android",
      browser: "Discord Android",
      device: "android",
    },
  },
  presence: () => ({
    status: PresenceUpdateStatus.Online,
    activities: [
      {
        name: "💠 https://odysseus.zip",
        type: ActivityType.Playing,
      },
    ],
    since: Date.now(),
    afk: false,
  }),
});

await client
  .start()
  .then(() => client.uploadCommands({ cachePath: "./commands.json" }));
