import {
  Command,
  CommandContext,
  createStringOption,
  Declare,
  Options,
} from "seyfert";
import { getData } from "../data/load";

const options = {
  name: createStringOption({
    description: "The name of the item to search for",
    autocomplete: async (interaction) => {
      let itemsData = (await getData()).items;
      const focus = interaction.getInput();
      const response = itemsData
        .filter((item) => item.name.includes(focus))
        .slice(0, 25)
        .map((item) => ({ name: item.name, value: item.id }));

      return interaction.respond(response);
    },
  }),
};

@Declare({
  name: "item",
  description: "Gets the stats of an item given its name.",
})
export default class ItemCommand extends Command {
  override async run(ctx: CommandContext<typeof options>) {}
}
