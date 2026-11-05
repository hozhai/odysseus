import { env } from "bun";
import { config } from "seyfert";

export default config.bot({
  token: env.TOKEN ?? "",
  locations: {
    base: "src",
    commands: "commands",
    events: "events",
    components: "components",
  },
  intents: ["Guilds"],
});
