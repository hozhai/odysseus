use poise::serenity_prelude;

use crate::models::Player;
use crate::utils::unhash_build_code;
use crate::{Context, Data, Error};

/// Loads a GearBuilder build from URL
#[poise::command(slash_command)]
pub async fn build(
    ctx: Context<'_>,
    #[description = "URL of the build"] url: String,
) -> Result<(), Error> {
    ctx.defer().await?;

    // Validate URL format
    if !url.starts_with("https://tools.arcaneodyssey.net/gearBuilder#")
        && !url.starts_with("https://aotools.woodyloody.com/gearBuilder#")
    {
        ctx.say("Invalid URL! Please provide a valid GearBuilder build URL.")
            .await?;
        return Ok(());
    }

    // Extract build code from URL
    let build_code = url.split("/gearBuilder#").collect::<Vec<_>>()[1];

    if build_code.is_empty() {
        ctx.say("Build URL appears to be empty or invalid.").await?;
        return Ok(());
    }

    // Parse the build
    match unhash_build_code(build_code) {
        Ok(player) => create_build_response(&ctx, &player).await?,
        Err(e) => {
            ctx.say(format!("❌ **Failed to parse build:** {}\n\n💡 **Tips:**\n• Make sure the URL is complete\n• Check that the build was saved properly\n• Try generating a new build URL", e)).await?;
        }
    }

    Ok(())
}

// TODO
async fn create_build_response(
    ctx: &poise::Context<'_, Data, Error>,
    player: &Player,
) -> Result<(), Error> {
    let total_stats = crate::calculate_total_stats(&player, &ctx.data());
    let formatted_total_stats = crate::format_total_stats(&total_stats);

    let embed = serenity_prelude::CreateEmbed::new()
        .title(format!("{}'s build", ctx.author().display_name()))
        .field("Level", player.level.to_string(), true)
        .field(
            "Stat Allocation",
            format!(
                "🟩 {} 🟦 {}\n 🟥 {} 🟨 {}",
                player.vitality_points,
                player.magic_points,
                player.strength_points,
                player.weapon_points
            ),
            true,
        )
        .field(
            "Magic/Fighting Styles",
            player
                .fighting_styles
                .iter()
                .map(|x| crate::magic_fs_into_emoji(*x as i32).unwrap())
                .collect::<Vec<String>>()
                .join(" "),
            true,
        )
        .field("Total Stats", formatted_total_stats, true);

    ctx.send(poise::CreateReply::default().embed(embed)).await?;

    Ok(())
}
