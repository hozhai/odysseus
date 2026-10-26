import {
  type CommandContext,
  ActionRow,
  Button,
  ButtonStyle,
  Embed,
} from "seyfert";

interface PaginationOptions {
  ctx: CommandContext;
  pages: Embed[];
  timeout?: number;
}

export async function createPagination({
  ctx,
  pages,
  timeout = 60000,
}: PaginationOptions) {
  if (!pages.length) return;

  let currentPage = 0;

  const getCurrentPage = () => {
    const page = pages[currentPage];
    if (!page) return null;
    return page;
  };

  // helper to generate the interactive control buttons
  const getButtons = (disabled = false) => {
    return new ActionRow<Button>().addComponents(
      new Button()
        .setCustomId("prev_page")
        .setLabel("◀ Prev")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(disabled || currentPage === 0),
      new Button()
        .setCustomId("page_indicator")
        .setLabel(`${currentPage + 1} / ${pages.length}`)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true),
      new Button()
        .setCustomId("next_page")
        .setLabel("Next ▶")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(disabled || currentPage === pages.length - 1)
    );
  };

  const initialPage = getCurrentPage();
  if (!initialPage) return;

  // send the initial first page
  const response = await ctx.write(
    {
      embeds: [initialPage],
      components: [getButtons()],
    },
    true
  );

  const collector = response.createComponentCollector({
    filter: (i) => i.user.id === ctx.author.id && i.isButton(),
    async onStop(reason) {
      if (reason === "idle") {
        try {
          return await ctx.editResponse({
            components: [],
          });
        } catch {
          // ignore errors if the message was deleted by the user
        }
      }
    },
    idle: timeout,
  });

  collector.run(["prev_page", "next_page"], async (i) => {
    if (i.customId === "prev_page" && currentPage > 0) {
      currentPage--;
    } else if (i.customId === "next_page" && currentPage < pages.length - 1) {
      currentPage++;
    }

    const page = getCurrentPage();
    if (!page) return;

    // update the embed and button disabled states smoothly
    return await i.update({
      embeds: [page],
      components: [getButtons()],
    });
  });
}
