use crate::{Context, Error, DEFAULT_COLOR, EMBED_FOOTER};
use poise::serenity_prelude as serenity;

/// Manage ping configurations. Requires Manage Roles permission.
#[poise::command(slash_command, subcommands("add", "remove", "list"))]
pub async fn pingset(_ctx: Context<'_>) -> Result<(), Error> {
    Ok(())
}

/// Add a new ping configuration
#[poise::command(slash_command)]
pub async fn add(
    ctx: Context<'_>,
    #[description = "Name for this ping type"] name: String,
    #[description = "Role to ping"] target: serenity::Role,
    #[description = "Role required to use this ping (optional)"] required: Option<serenity::Role>,
    #[description = "Description of this ping type"] description: Option<String>,
) -> Result<(), Error> {
    ctx.defer().await?;

    let guild_id = match ctx.guild_id() {
        Some(id) => id.get() as i64,
        None => {
            ctx.say("❌ This command can only be used in a server!")
                .await?;
            return Ok(());
        }
    };

    // Check if user has Manage Roles permission (simplified check)
    let has_permission = match ctx.author_member().await {
        Some(member) =>
        {
            #[allow(deprecated)]
            member
                .permissions(&ctx.serenity_context().cache)
                .map(|perms| perms.manage_roles())
                .unwrap_or(false)
        }
        None => {
            ctx.say("❌ Could not verify your permissions.").await?;
            return Ok(());
        }
    };

    if !has_permission {
        let response = poise::CreateReply::default()
            .content("❌ You need the 'Manage Roles' permission to use this command!")
            .ephemeral(true);
        ctx.send(response).await?;
        return Ok(());
    }

    // Validate name (no spaces, alphanumeric only)
    if !name
        .chars()
        .all(|c| c.is_alphanumeric() || c == '_' || c == '-')
    {
        let response = poise::CreateReply::default()
            .content(
                "❌ Ping name can only contain alphanumeric characters, underscores, and hyphens!",
            )
            .ephemeral(true);
        ctx.send(response).await?;
        return Ok(());
    }

    if name.len() > 50 {
        let response = poise::CreateReply::default()
            .content("❌ Ping name must be 50 characters or less!")
            .ephemeral(true);
        ctx.send(response).await?;
        return Ok(());
    }

    // Ensure guild exists in database
    ctx.data().db.ensure_guild_exists(guild_id).await?;

    // Check if ping config already exists
    if let Some(_) = ctx.data().db.get_ping_config(guild_id, &name).await? {
        let response = poise::CreateReply::default()
            .content(format!(
                "❌ A ping configuration named '{}' already exists!",
                name
            ))
            .ephemeral(true);
        ctx.send(response).await?;
        return Ok(());
    }

    // Add the ping configuration
    let required_role_id = required.as_ref().map(|r| r.id.get() as i64);
    let target_role_id = target.id.get() as i64;

    ctx.data()
        .db
        .add_ping_config(
            guild_id,
            &name,
            description.as_deref(),
            required_role_id,
            target_role_id,
        )
        .await?;

    let mut response_content = format!(
        "✅ Successfully created ping configuration **{}**!\n\n",
        name
    );
    response_content.push_str(&format!("**Target Role:** <@&{}>\n", target.id.get()));

    if let Some(req_role) = required {
        response_content.push_str(&format!("**Required Role:** <@&{}>\n", req_role.id.get()));
    } else {
        response_content.push_str("**Required Role:** None (anyone can use)\n");
    }

    if let Some(desc) = description {
        response_content.push_str(&format!("**Description:** {}\n", desc));
    }

    ctx.say(response_content).await?;
    Ok(())
}

/// Remove a ping configuration
#[poise::command(slash_command)]
pub async fn remove(
    ctx: Context<'_>,
    #[description = "Name of ping type to remove"]
    #[autocomplete = "autocomplete_ping_remove"]
    name: String,
) -> Result<(), Error> {
    let guild_id = match ctx.guild_id() {
        Some(id) => id.get() as i64,
        None => {
            ctx.say("❌ This command can only be used in a server!")
                .await?;
            return Ok(());
        }
    };

    // Check if user has Manage Roles permission (simplified check)
    let has_permission = match ctx.author_member().await {
        Some(member) =>
        {
            #[allow(deprecated)]
            member
                .permissions(&ctx.serenity_context().cache)
                .map(|perms| perms.manage_roles())
                .unwrap_or(false)
        }
        None => {
            ctx.say("❌ Could not verify your permissions.").await?;
            return Ok(());
        }
    };

    if !has_permission {
        let response = poise::CreateReply::default()
            .content("❌ You need the 'Manage Roles' permission to use this command!")
            .ephemeral(true);
        ctx.send(response).await?;
        return Ok(());
    }

    // Try to remove the ping configuration
    let removed = ctx.data().db.remove_ping_config(guild_id, &name).await?;

    if removed {
        ctx.say(format!(
            "✅ Successfully removed ping configuration **{}**!",
            name
        ))
        .await?;
    } else {
        let response = poise::CreateReply::default()
            .content(format!("❌ Ping configuration '{}' not found!", name))
            .ephemeral(true);
        ctx.send(response).await?;
    }

    Ok(())
}

async fn autocomplete_ping_remove(ctx: Context<'_>, partial: &str) -> impl Iterator<Item = String> {
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

/// List all ping configurations
#[poise::command(slash_command)]
pub async fn list(ctx: Context<'_>) -> Result<(), Error> {
    let guild_id = match ctx.guild_id() {
        Some(id) => id.get() as i64,
        None => {
            ctx.say("❌ This command can only be used in a server!")
                .await?;
            return Ok(());
        }
    };

    let configs = ctx.data().db.get_ping_configs(guild_id).await?;

    if configs.is_empty() {
        ctx.say("📝 No ping configurations found for this server.\n\nUse `/pingset add` to create your first ping configuration!").await?;
        return Ok(());
    }

    let embed = serenity::CreateEmbed::new()
        .title("📋 Ping Configurations")
        .description(format!(
            "Found {} ping configurations for this server:",
            configs.len()
        ))
        .color(DEFAULT_COLOR)
        .footer(serenity::CreateEmbedFooter::new(EMBED_FOOTER));

    let embed = configs.iter().take(10).fold(embed, |embed, config| {
        let mut field_value = format!("**Target:** <@&{}>\n", config.target_role_id);

        if let Some(req_role_id) = config.required_role_id {
            field_value.push_str(&format!("**Required Role:** <@&{}>\n", req_role_id));
        } else {
            field_value.push_str("**Required Role:** None (anyone can use)\n");
        }

        if let Some(ref desc) = config.description {
            field_value.push_str(&format!("**Description:** {}", desc));
        }

        embed.field(&config.name, field_value, true)
    });

    let response = poise::CreateReply::default().embed(embed);

    if configs.len() > 10 {
        let warning = format!("⚠️ Showing first 10 of {} configurations.", configs.len());
        let response = response.content(warning);
        ctx.send(response).await?;
    } else {
        ctx.send(response).await?;
    }

    Ok(())
}
