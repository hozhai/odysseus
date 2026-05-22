import {
    ActionRow,
    ComponentCommand,
    ComponentContext,
    Embed,
    StringSelectMenu,
    StringSelectOption,
} from "seyfert";
import { getData } from "../data/load";
import { itemEnchantToEmoji } from "../utils/item";

export default class ItemSetEnchantButton extends ComponentCommand {
    componentType = "Button" as const;

    override filter(ctx: ComponentContext<typeof this.componentType>) {
        return ctx.customId === "item_set_enchant";
    }

    async run(ctx: ComponentContext<typeof this.componentType>) {
        await ctx.deferUpdate(); // do not remove lmao

        const msg = ctx.interaction?.message;
        const embed = msg?.embeds?.[0];

        if (!embed) {
            await ctx.editResponse({
                content:
                    "Error: previous message did not contain a valid embed.",
            });
            return;
        }

        const itemsData = (await getData()).items;

        const selectMenu = new StringSelectMenu()
            .setCustomId("item_select_enchant")
            .setPlaceholder("Select an enchant...")
            .setRequired(true)
            .setValuesLength({ max: 1, min: 1 });

        Object.values(itemsData)
            .filter(
                (val) =>
                    val.mainType === "Enchant" &&
                    val.name !== "Sturdy" &&
                    val.name !== "Reinforced" &&
                    val.name !== "Warship"
            )
            .forEach((ench) => {
                const option = new StringSelectOption();
                option.setLabel(ench.name);
                option.setValue(ench.name.toLowerCase());

                const emoji = itemEnchantToEmoji(ench);
                if (emoji) {
                    option.setEmoji(emoji);
                }

                selectMenu.addOption([option]);
            });

        const row = new ActionRow().setComponents([selectMenu]);

        await ctx.editResponse({
            embeds: [embed],
            components: [row],
        });
    }
}
