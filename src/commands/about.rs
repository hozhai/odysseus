use crate::{Context, Error, DEFAULT_COLOR, EMBED_FOOTER, VERSION};
use poise::serenity_prelude as serenity;
use serenity::builder::CreateEmbed;

/// About Odysseus
#[poise::command(slash_command)]
pub async fn about(ctx: Context<'_>) -> Result<(), Error> {
    let embed = CreateEmbed::new()
        .title(format!("About Odysseus {VERSION}")) .description("Odysseus is a general-purpose utility bot for Arcane Odyssey, a Roblox game where you embark through an epic journey through the War Seas.\n\nThis is a side project by <@360235359746916352> and an excuse to learn Go and Rust. [Here's](https://github.com/hozhai/odysseus) the source code of the project.\n\nJoin our [Discord server](https://discord.gg/Z3uKnGHvMN) for suggestions, bugs, and support!\n\nOh, and if you'd like to support Odysseus, you can [buy zhai a coffee](https://ko-fi.com/khzhai) to help them host the bot and keep it paywall-free!")
        .image("https://raw.githubusercontent.com/hozhai/odysseus/refs/heads/main/assets/banner.webp")
        .color(DEFAULT_COLOR)
        .footer(serenity::CreateEmbedFooter::new(EMBED_FOOTER));

    ctx.send(poise::CreateReply::default().embed(embed)).await?;
    Ok(())
}
