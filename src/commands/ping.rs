use crate::{Context, Error};
use poise::serenity_prelude as serenity;

/// Send a ping using configured ping types
#[poise::command(slash_command)]
pub async fn ping(
    ctx: Context<'_>,
    #[description = "Type of ping to send"]
    #[autocomplete = "autocomplete_ping_type"]
    ping_type: String,
    #[description = "Optional message to include with the ping"] message: Option<String>,
) -> Result<(), Error> {
    let guild_id = match ctx.guild_id() {
        Some(id) => id.get() as i64,
        None => {
            ctx.say("❌ This command can only be used in a server!")
                .await?;
            return Ok(());
        }
    };

    // Get the ping configuration
    let config = match ctx.data().db.get_ping_config(guild_id, &ping_type).await? {
        Some(config) => config,
        None => {
            let response = poise::CreateReply::default()
                .content(format!("❌ Ping configuration '{}' not found!", ping_type))
                .ephemeral(true);
            ctx.send(response).await?;
            return Ok(());
        }
    };

    // Check if user has required role (if set)
    if let Some(required_role_id) = config.required_role_id {
        let member = match ctx.author_member().await {
            Some(member) => member,
            None => {
                let response = poise::CreateReply::default()
                    .content("❌ Could not verify your permissions.")
                    .ephemeral(true);
                ctx.send(response).await?;
                return Ok(());
            }
        };

        let required_role_id = required_role_id as u64;
        let has_role = member
            .roles
            .iter()
            .any(|role_id| role_id.get() == required_role_id);

        if !has_role {
            let response = poise::CreateReply::default()
                .content("❌ You don't have permission to use this ping!")
                .ephemeral(true);
            ctx.send(response).await?;
            return Ok(());
        }
    }

    // Build the ping message
    let mut content = format!(
        "<@{}> has pinged <@&{}>!",
        ctx.author().id.get(),
        config.target_role_id
    );

    if let Some(ref msg) = message {
        content.push_str(&format!(" - {}", msg));
    }

    let response = poise::CreateReply::default()
        .content(content)
        .allowed_mentions(
            poise::serenity_prelude::CreateAllowedMentions::new()
                .roles(vec![serenity::RoleId::new(config.target_role_id as u64)]),
        );

    ctx.send(response).await?;

    Ok(())
}

async fn autocomplete_ping_type(ctx: Context<'_>, partial: &str) -> impl Iterator<Item = String> {
    let guild_id = match ctx.guild_id() {
        Some(id) => id.get() as i64,
        None => return std::iter::empty::<String>().collect::<Vec<_>>().into_iter(),
    };

    let configs = match ctx.data().db.get_ping_configs(guild_id).await {
        Ok(configs) => configs,
        Err(_) => return std::iter::empty::<String>().collect::<Vec<_>>().into_iter(),
    };

    let partial_lower = partial.to_lowercase();
    let mut results = Vec::new();

    for config in configs {
        if config.name.to_lowercase().contains(&partial_lower) && results.len() < 25 {
            results.push(config.name);
        }
    }

    results.into_iter()
}
