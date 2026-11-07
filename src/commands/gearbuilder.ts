import { EMBED_FOOTER } from "@/constants";
import { getEmojis } from "@/data";
import {
  Declare,
  Command,
  type CommandContext,
  MessageFlags,
  Container,
  TextDisplay,
  Section,
  Separator,
  Button,
  ButtonStyle,
  Formatter,
  ActionRow,
} from "seyfert";

@Declare({
  name: "gearbuilder",
  description: "Allows you to create a build.",
})
export default class GearbuilderCommand extends Command {
  override async run(ctx: CommandContext) {
    const magicEmojis = (await getEmojis()).magics;
    const defaultMagicEmoji = magicEmojis["Acid"];

    if (!defaultMagicEmoji) {
      await ctx.write({
        content:
          "Unable to load necessary emojis. Please contact the developer.",
      });
      throw Error("Default (Acid) emoji not found");
    }

    const component = new Container().addComponents(
      new TextDisplay().setContent(`## Gearbuilder`),
      new Section()
        .setComponents(
          new TextDisplay().setContent("Accessory:"),
          new TextDisplay().setContent(
            "Item: None\nEnchant: None\nModifier: None\nGem(s): None"
          )
        )
        .setAccessory(
          new Button()
            .setLabel("Modify")
            .setStyle(ButtonStyle.Secondary)
            .setCustomId("gb_choose_acc_1")
        ),
      new Section()
        .setComponents(
          new TextDisplay().setContent("Accessory:"),
          new TextDisplay().setContent(
            "Item: None\nEnchant: None\nModifier: None\nGem(s): None"
          )
        )
        .setAccessory(
          new Button()
            .setLabel("Modify")
            .setStyle(ButtonStyle.Secondary)
            .setCustomId("gb_choose_acc_2")
        ),
      new Section()
        .setComponents(
          new TextDisplay().setContent("Accessory:"),
          new TextDisplay().setContent(
            "Item: None\nEnchant: None\nModifier: None\nGem(s): None"
          )
        )
        .setAccessory(
          new Button()
            .setLabel("Modify")
            .setStyle(ButtonStyle.Secondary)
            .setCustomId("gb_choose_acc_3")
        ),
      new Section()
        .setComponents(
          new TextDisplay().setContent("Chestplate:"),
          new TextDisplay().setContent(
            "Item: None\nEnchant: None\nModifier: None\nGem(s): None"
          )
        )
        .setAccessory(
          new Button()
            .setLabel("Modify")
            .setStyle(ButtonStyle.Secondary)
            .setCustomId("gb_choose_chest")
        ),
      new Section()
        .setComponents(
          new TextDisplay().setContent("Pants:"),
          new TextDisplay().setContent(
            "Item: None\nEnchant: None\nModifier: None\nGem(s): None"
          )
        )
        .setAccessory(
          new Button()
            .setLabel("Modify")
            .setStyle(ButtonStyle.Secondary)
            .setCustomId("gb_choose_pants")
        ),
      new Separator(),
      new Section()
        .setComponents(
          new TextDisplay().setContent("Magic/Fighting Styles"),
          new TextDisplay().setContent(
            `${Formatter.emojiMention(defaultMagicEmoji.id, defaultMagicEmoji.name)}`
          )
        )
        .setAccessory(
          new Button()
            .setLabel("Modify")
            .setStyle(ButtonStyle.Secondary)
            .setCustomId("gb_modify_magicfs")
        ),
      new Section()
        .setComponents(
          new TextDisplay().setContent("Player Level"),
          new TextDisplay().setContent("175")
        )
        .setAccessory(
          new Button()
            .setLabel("Modify")
            .setStyle(ButtonStyle.Secondary)
            .setCustomId("gb_modify_level")
        ),
      new Section()
        .setComponents(
          new TextDisplay().setContent("Stat Allocation"),
          new TextDisplay().setContent("🟨 0 🟦 0 🟥 0 ⬜️ 0")
        )
        .setAccessory(
          new Button()
            .setLabel("Modify")
            .setStyle(ButtonStyle.Secondary)
            .setCustomId("gb_modify_statalloc")
        ),
      new Separator(),
      new ActionRow().addComponents(
        new Button()
          .setLabel("Get Stats")
          .setStyle(ButtonStyle.Success)
          .setCustomId("gb_get")
      ),
      new TextDisplay().setContent(
        `-# ${EMBED_FOOTER} | Command executed by \`${ctx.author.username}\``
      )
    );

    await ctx.write({
      components: [component],
      flags: MessageFlags.IsComponentsV2,
    });
  }
}
