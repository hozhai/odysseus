use crate::{Context, Error, DEFAULT_COLOR, EMBED_FOOTER};
use poise::serenity_prelude as serenity;
use serenity::builder::CreateEmbed;

/// Calculate your damage given certain stats
#[poise::command(slash_command)]
pub async fn damagecalc(ctx: Context<'_>) -> Result<(), Error> {
    let embed = CreateEmbed::new()
        .title("Damage Calculator")
        .description("Click the button below and fill out the fields to start calculating!")
        .author(serenity::CreateEmbedAuthor::new(&ctx.author().name).icon_url(ctx.author().face()))
        .color(DEFAULT_COLOR)
        .footer(serenity::CreateEmbedFooter::new(EMBED_FOOTER));

    let components = vec![serenity::CreateActionRow::Buttons(vec![
        serenity::CreateButton::new("dmgcalc_attacker_raw")
            .style(serenity::ButtonStyle::Primary)
            .label("Set Attacker Raw Stats"),
    ])];

    ctx.send(
        poise::CreateReply::default()
            .embed(embed)
            .components(components),
    )
    .await?;

    Ok(())
}
