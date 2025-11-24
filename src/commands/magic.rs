use crate::{utils::find_magic_by_name, Context, Error, DEFAULT_COLOR, EMBED_FOOTER};
use poise::serenity_prelude as serenity;

/// Get information about a magic
#[poise::command(slash_command)]
pub async fn magic(
    ctx: Context<'_>,
    #[description = "Name of the magic"]
    #[autocomplete = "autocomplete_magic"]
    magic: String,
) -> Result<(), Error> {
    let data = ctx.data();

    if let Some(magic) = find_magic_by_name(data, &magic) {
        let mut embed = serenity::CreateEmbed::new()
            .title(&magic.name)
            .description(&magic.legend)
            .thumbnail(magic.image_id)
            .color(DEFAULT_COLOR)
            .footer(serenity::CreateEmbedFooter::new(EMBED_FOOTER));

        embed = embed.field("Special Effect", &magic.special_effect, true);

        let response = poise::CreateReply::default().embed(embed);
        ctx.send(response).await?;
    } else {
        let response = poise::CreateReply::default()
            .content("❌ Magic not found!")
            .ephemeral(true);
        ctx.send(response).await?;
    }

    Ok(())
}

#[allow(dead_code)]
async fn autocomplete_magic(ctx: Context<'_>, partial: &str) -> impl Iterator<Item = String> {
    let data = ctx.data();
    let magics = data.magic_data.read();

    magics
        .iter()
        .filter(|magic| magic.name.to_lowercase().contains(&partial.to_lowercase()))
        .take(20)
        .map(|magic| magic.name.clone())
        .collect::<Vec<_>>()
        .into_iter()
}
