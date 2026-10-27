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
    client.logger.info("==============");
    client.logger.info("Loaded data");

    client.logger.info(`items.yaml: ${Object.values(data.items).length}`);
    client.logger.info(`magics.yaml: ${data.magics.length}`);
    client.logger.info(`weapons.yaml: ${data.weapons.length}`);
    client.logger.info(`enchants.yaml: ${Object.values(data.enchants).length}`);
    client.logger.info(
      `modifiers.yaml: ${Object.values(data.modifiers).length}`
    );
    client.logger.info(`gems.yaml: ${Object.values(data.gems).length}`);

    client.logger.info("==============");
  },
});
