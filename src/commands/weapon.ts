import {
  Declare,
  Command,
  type CommandContext,
  createStringOption,
  Options,
  Embed,
  type APIEmbedField,
} from "seyfert";
import { getData } from "../data/load";
import { getRarityColor } from "../utils";
import { EMBED_FOOTER } from "../constants";
import { clamp } from "../utils/misc";

const options = {
  name: createStringOption({
    description: "The name of the weapon to search for.",
    required: true,
    autocomplete: async (interaction) => {
      const weaponsData = (await getData()).weapons;
      const focus = interaction.getInput();
      const response = weaponsData
        .filter((val) => val.name.toLowerCase().includes(focus.toLowerCase()))
        .slice(0, 25)
        .map((val) => ({ name: val.name, value: val.name }));

      return interaction.respond(response);
    },
  }),
};

@Declare({
  name: "weapon",
  description: "Displays Odysseus' commands.",
})
@Options(options)
export default class WeaponCommand extends Command {
  override async run(ctx: CommandContext<typeof options>) {
    const response = ctx.options.name;
    const weaponsData = (await getData()).weapons;
    const weapon = weaponsData.find((weapon) => weapon.name === response);

    if (!weapon) {
      await ctx.write({
        content: `Selected weapon does not exist! Item: ${response}`,
      });
      return;
    }

    const fields: APIEmbedField[] = [
      {
        name: "Description",
        value: weapon.legend,
      },
      {
        name: "Special Effect",
        value: weapon.specialEffect,
      },
    ];

    if (weapon.defense) {
      fields.push({
        name: "Defense",
        value: weapon.defense.toString(),
        inline: true,
      });
    }

    if (weapon.blockingPower) {
      fields.push({
        name: "Blocking Power",
        value: weapon.blockingPower.toString(),
        inline: true,
      });
    }

    if (weapon.weight) {
      fields.push({
        name: "Weight",
        value: weapon.weight.toString(),
        inline: true,
      });
    }

    fields.push(
      ...[
        {
          name: "Damage",
          value: `${createWeaponStatBar(weapon.damage, 0.9, 1.15, "🟧")} ${weapon.damage}x`,
        },
        {
          name: "Speed",
          value: `${createWeaponStatBar(weapon.speed, 0.7, 1.2, "🟦")} ${weapon.speed}x`,
        },
        {
          name: "Size",
          value: `${createWeaponStatBar(weapon.size, 0.75, 1.3, "🟩")} ${weapon.size}x`,
        },
      ]
    );

    const embed = new Embed()
      .setAuthor({
        name: ctx.author.username,
        iconUrl: ctx.author.avatarURL(),
      })
      .setThumbnail(weapon.imageId)
      .setTitle(`${weapon.name}`)
      .setColor(getRarityColor(weapon.rarity))
      .setFooter({ text: EMBED_FOOTER })
      .setFields(fields);

    await ctx.write({
      embeds: [embed],
    });
  }
}

export function createWeaponStatBar(
  value: number,
  min: number,
  max: number,
  emoji: string
): string {
  const normalized = clamp(0, (value - min) / (max - min), 1);
  const scaled = Math.round(normalized * 9) + 1;
  const filled = clamp(1, scaled, 10);

  return emoji.repeat(filled);
}
