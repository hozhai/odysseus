use crate::{Context, Error, DEFAULT_COLOR, EMBED_FOOTER};
use poise::serenity_prelude as serenity;
use serenity::builder::CreateEmbed;

/// Displays the help menu
#[poise::command(slash_command)]
pub async fn help(ctx: Context<'_>) -> Result<(), Error> {
    let embed = CreateEmbed::new()
        .title("Odysseus Help")
        .description("Here are all available commands:")
        .field("/help", "Shows this help menu", false)
        .field("/latency", "Returns the API latency", false)
        .field("/about", "About Odysseus", false)
        .field("/wiki <query>", "Searches the wiki", false)
        .field("/build <url>", "Loads a GearBuilder build from URL", false)
        .field("/item <name>", "Get information about an item", false)
        .field("/weapon <name>", "Get information about a weapon", false)
        .field(
            "/damagecalc",
            "Calculate your damage given certain stats",
            false,
        )
        .field(
            "/sort <stat> [type]",
            "Sort and display items by specific stats",
            false,
        )
        .field(
            "/ping <type> [message]",
            "Send a ping using configured ping types",
            false,
        )
        .field(
            "/pingset",
            "Manage ping configurations (requires Manage Roles)",
            false,
        )
        .color(DEFAULT_COLOR)
        .footer(serenity::CreateEmbedFooter::new(EMBED_FOOTER));

    ctx.send(poise::CreateReply::default().embed(embed)).await?;
    Ok(())
}
