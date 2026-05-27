import { createEvent } from "seyfert";
import { getData } from "../data/load";
import { VERSION } from "../constants";

export default createEvent({
  // botReady is triggered when all shards and servers are ready.
  // `once` ensures the event runs only once.
  data: { once: true, name: "botReady" },
  async run(user, client) {
    //  We can use client.logger to display messages in the console.
    client.logger.info(
      `${user.username}#${user.discriminator} (${user.id}) v${VERSION} is ready`
    );

    // Load data on startup
    const data = await getData();
    client.logger.info("Loaded data")
    client.logger.info("| items.yaml | magics.yaml | weapons.yaml | enchants.yaml | modifiers.yaml | gems.yaml |")
    client.logger.info("|--------------------------------------------------------------------------------------|")
    client.logger.info(
      `| ${Object.values(data.items).length.toString().padEnd(10)} | ${data.magics.length.toString().padEnd(11)} | ${data.weapons.length.toString().padEnd(12)} | ${Object.values(data.enchants).length.toString().padEnd(13)} | ${Object.values(data.modifiers).length.toString().padEnd(14)} | ${Object.values(data.gems).length.toString().padEnd(9)} |`
    );
  },
});
