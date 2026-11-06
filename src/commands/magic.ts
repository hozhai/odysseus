import {
  Declare,
  Command,
  type CommandContext,
  createStringOption,
  Options,
  Embed,
  MessageFlags,
} from "seyfert";
import { getData } from "@data";
import { findMagicByName, magicToEmoji } from "@utils";
import { EMBED_COLOR_DEFAULT, EMBED_FOOTER } from "@constants";

const options = {
  name: createStringOption({
    description: "The name of the magic to search for.",
    required: true,
    autocomplete: async (interaction) => {
      const magicsData = (await getData()).magics;
      const focus = interaction.getInput();
      const response = magicsData
        .filter((val) => val.name.toLowerCase().includes(focus.toLowerCase()))
        .slice(0, 25)
        .map((val) => ({ name: val.name, value: val.name }));

      return interaction.respond(response);
    },
  }),
};

@Declare({
  name: "magic",
  description: "Gets the stats of a magic given its name.",
})
@Options(options)
export default class MagicCommand extends Command {
  override async run(ctx: CommandContext<typeof options>) {
    const response = ctx.options.name;
    const magic = await findMagicByName(response);

    if (!magic) {
      await ctx.write({
        content: `Selected magic does not exist! Item: ${response}`,
      });
      return;
    }

    const embed = new Embed()
      .setAuthor({
        name: ctx.author.username,
        iconUrl: ctx.author.avatarURL(),
      })
      .setThumbnail(magic.imageId)
      .setTitle(`${magic.name}`)
      .setColor(EMBED_COLOR_DEFAULT)
      .setFooter({ text: EMBED_FOOTER })
      .setFields([
        {
          name: "Description",
          value: magic.legend,
        },
        {
          name: "Special Effect",
          value: magic.specialEffect,
          inline: true,
        },
        {
          name: "Unimbued Stats",
          value: `
            <:power:1392363667059904632> ${magic.unimbued.damage}x
            <:attackspeed:1392364933722804274> ${magic.unimbued.speed}x
            <:attacksize:1392364917616807956> ${magic.unimbued.size}x
            `,
          inline: true,
        },
        {
          name: "Imbued Stats",
          value: `
            <:power:1392363667059904632> ${magic.imbued.damage}x
            <:attackspeed:1392364933722804274> ${magic.imbued.speed}x
            <:attacksize:1392364917616807956> [cj] ${magic.imbued.size.conjurer}x
            <:attacksize:1392364917616807956> [wl] ${magic.imbued.size.warlock}x
            `,
          inline: true,
        },
        {
          name: "Outclashes",
          value: (
            await Promise.all(
              magic.clash.over.map(async (name) => {
                const emoji = await magicToEmoji(name);
                if (!emoji) return "";
                return emoji as string;
              })
            )
          ).join("\n"),
          inline: true,
        },
        {
          name: "Neutral to",
          value: (
            await Promise.all(
              magic.clash.neutral.map(async (name) => {
                const emoji = await magicToEmoji(name);
                if (!emoji) return "";
                return emoji as string;
              })
            )
          ).join("\n"),
          inline: true,
        },
        {
          name: "Outclashed by",
          value: (
            await Promise.all(
              magic.clash.under.map(async (name) => {
                const emoji = await magicToEmoji(name);
                if (!emoji) return "";
                return emoji as string;
              })
            )
          ).join("\n"),
          inline: true,
        },
      ]);

    await ctx.write({
      embeds: [embed],
    });

    {
      const oldDataEmbed = new Embed()
        .setAuthor({
          name: ctx.author.username,
          iconUrl: ctx.author.avatarURL(),
        })
        .setDescription(
          `Thanks for using the /${this.name} command! Please keep in mind data **may not be complete or updated**. We're actively working on it!`
        )
        .setColor(EMBED_COLOR_DEFAULT)
        .setFooter({ text: EMBED_FOOTER });

      await ctx.followup({
        embeds: [oldDataEmbed],
        flags: MessageFlags.Ephemeral,
      });
    }
  }
}
