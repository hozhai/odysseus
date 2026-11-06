import { ComponentCommand, ComponentContext, MessageFlags } from "seyfert";

export default class GearbuilderSelectItemAccessoryOneIdButton extends ComponentCommand {
  componentType = "Button" as const;

  override filter(ctx: ComponentContext<typeof this.componentType>) {
    return ctx.customId.startsWith("gb_select_item_acc_1_");
  }

  async run(ctx: ComponentContext<typeof this.componentType>) {
    const itemId = ctx.customId.split("_")[5];
    const oldMsgId = ctx.message.content
      .split("\n")
      .filter((line) => line.startsWith("-#"))[0]
      ?.split(" ")[1];

    if (!oldMsgId) {
      await ctx.write({
        content: "Could not track original message ID",
      });
      return;
    }

    await ctx.write({
      content: `You selected item ID ${itemId}\n-# ${oldMsgId}`,
    });

    const oldMsg = await ctx.client.messages.fetch(oldMsgId, ctx.channelId);

    const oldMsgComponent = oldMsg.components.map((component) =>
      component.toJSON()
    ) as NonNullable<Parameters<typeof oldMsg.edit>[0]["components"]>;

    await oldMsg.edit({
      components: oldMsgComponent,
      flags: MessageFlags.IsComponentsV2,
    });
  }
}
