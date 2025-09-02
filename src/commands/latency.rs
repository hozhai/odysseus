use crate::{Context, Error, DEFAULT_COLOR, EMBED_FOOTER};
use poise::serenity_prelude as serenity;
use serenity::builder::CreateEmbed;
use std::time::Instant;

/// Returns the API latency
#[poise::command(slash_command)]
pub async fn latency(ctx: Context<'_>) -> Result<(), Error> {
    let start = Instant::now();
    let msg = ctx.say("Pinging...").await?;
    let duration = start.elapsed();

    let embed = CreateEmbed::new()
        .title("🏓 Pong!")
        .field("API Latency", format!("{}ms", duration.as_millis()), false)
        .color(DEFAULT_COLOR)
        .footer(serenity::CreateEmbedFooter::new(EMBED_FOOTER));

    msg.edit(ctx, poise::CreateReply::default().embed(embed).content(""))
        .await?;
    Ok(())
}
