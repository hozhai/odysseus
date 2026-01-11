use crate::utils::search_wiki;
use crate::{Context, Error, DEFAULT_COLOR, EMBED_FOOTER};
use poise::serenity_prelude as serenity;
use serenity::builder::CreateEmbed;
use tracing::error;

/// Searches the wiki
#[poise::command(slash_command)]
pub async fn wiki(
    ctx: Context<'_>,
    #[description = "What to search for on the wiki"] query: String,
) -> Result<(), Error> {
    ctx.defer().await?;

    match search_wiki(&query).await {
        Ok(results) => {
            if results.is_empty() {
                ctx.say("No results found for your search query.").await?;
                return Ok(());
            }

            let mut embed = CreateEmbed::new()
                .title(&format!("Wiki Search Results for: '{}'", query))
                .url(format!("https://roblox-arcane-odyssey.fandom.com/wiki/Special:Search?scope=internal&navigationSearch=true&query={}", urlencoding::encode(&query)))
                .color(DEFAULT_COLOR)
                .footer(serenity::CreateEmbedFooter::new(EMBED_FOOTER));

            for (i, result) in results.iter().take(5).enumerate() {
                let description = if result.description.len() > 100 {
                    format!("{}...", &result.description[..97])
                } else {
                    result.description.clone()
                };

                embed = embed.field(
                    &format!("{}. {}", i + 1, result.title),
                    &format!("{}\n[Read more]({})", description, result.url),
                    false,
                );
            }

            ctx.send(poise::CreateReply::default().embed(embed)).await?;
        }
        Err(e) => {
            error!("Error searching wiki: {}", e);
            ctx.say("Failed to search the wiki. Please try again later.")
                .await?;
        }
    }

    Ok(())
}
