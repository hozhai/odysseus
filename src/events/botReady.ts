import { createEvent } from "seyfert";
import { getData } from "../data/load";

export default createEvent({
    // botReady is triggered when all shards and servers are ready.
    // `once` ensures the event runs only once.
    data: { once: true, name: "botReady" },
    async run(user, client) {
        //  We can use client.logger to display messages in the console.
        client.logger.info(
            `${user.username}#${user.discriminator} (${user.id}) is ready`
        );

        // Load data on startup
        const data = await getData();
        client.logger.info(
            `Loaded items.json?length=${Object.values(data.items).length}, magics.json?length=${data.magics.length}, and weapons.json?length=${data.weapons.length}`
        );
    },
});
