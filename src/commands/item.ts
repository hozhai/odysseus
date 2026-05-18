import {
  Command,
  CommandContext,
  createStringOption,
  Declare,
  Embed,
  Options,
  SubCommand,
} from "seyfert";
import { getData } from "../data/load";
import { TotalStats } from "../types";
import { MAX_LEVEL } from "../constants";
import { formatTotalStats } from "../utils/stats";

const options = {
  name: createStringOption({
    description: "The name of the item to search for",
    required: true,
    autocomplete: async (interaction) => {
      let itemsData = (await getData()).items;
      const focus = interaction.getInput();
      const response = Object.values(itemsData)
        .filter((val) => val.name.toLowerCase().includes(focus.toLowerCase()))
        .slice(0, 25)
        .map((val) => ({ name: val.name, value: val.id }));

      return interaction.respond(response);
    },
  }),
};

@Declare({
  name: "item",
  description: "Gets the stats of an item given its name.",
})
@Options(options)
export default class ItemCommand extends Command {
  override async run(ctx: CommandContext<typeof options>) {
    let response = ctx.options.name;
    let itemsData = (await getData()).items;
    let item = itemsData[response];
    let scaling = item.scaling ?? {};

    let totalStats: TotalStats = {
      power: (scaling.power ?? 0) * MAX_LEVEL,
      defense: (scaling.defense ?? 0) * MAX_LEVEL,
      agility: (scaling.agility ?? 0) * MAX_LEVEL,
      attackSpeed: (scaling.attackSpeed ?? 0) * MAX_LEVEL,
      attackSize: (scaling.attackSize ?? 0) * MAX_LEVEL,
      intensity: (scaling.intensity ?? 0) * MAX_LEVEL,
      regeneration: (scaling.regeneration ?? 0) * MAX_LEVEL,
      piercing: (scaling.piercing ?? 0) * MAX_LEVEL,
      resistance: (scaling.resistance ?? 0) * MAX_LEVEL,
      insanity: 0,
      warding: scaling.warding ?? 0,
      drawback: scaling.drawback ?? 0,
    };

    let formattedStats = formatTotalStats(totalStats);

    let embed = new Embed()
      .setAuthor({
        name: ctx.author.username,
        iconUrl: ctx.author.avatarURL(),
      })
      .setThumbnail(item.imageId)
      .setFields([
        {
          name: "Description",
          value: item.legend,
          inline: false,
        },
        {
          name: "Stats",
          value: formattedStats,
          inline: false,
        },
      ]);

    ctx.write({
      embeds: [embed],
    });
  }
}
