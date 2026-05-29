import { config } from "seyfert";

export default config.bot({
  token: Bun.env.TOKEN ?? "",
  locations: {
    base: "src",
    commands: "commands",
    events: "events",
    components: "components",
  },
  intents: ["Guilds"],
});
