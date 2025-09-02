use crate::{Context, Error, DEFAULT_COLOR, EMBED_FOOTER, VERSION};
use poise::serenity_prelude as serenity;
use serenity::builder::CreateEmbed;

/// About Odysseus
#[poise::command(slash_command)]
pub async fn about(ctx: Context<'_>) -> Result<(), Error> {
    let embed = CreateEmbed::new()
        .title("About Odysseus")
        .description("A Discord bot for Arcane Odyssey")
        .field("Version", VERSION, true)
        .field("Author", "hozhai", true)
        .field("Language", "Rust", true)
        .field("Framework", "Serenity + Poise", true)
        .color(DEFAULT_COLOR)
        .footer(serenity::CreateEmbedFooter::new(EMBED_FOOTER));

    ctx.send(poise::CreateReply::default().embed(embed)).await?;
    Ok(())
}
