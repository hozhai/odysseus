use crate::utils::{create_weapon_stat_bar, find_weapon_by_name, get_rarity_color};
use crate::{Context, Error, EMBED_FOOTER};
use poise::serenity_prelude as serenity;

/// Get information about a weapon
#[poise::command(slash_command)]
pub async fn weapon(
    ctx: Context<'_>,
    #[description = "Name of the weapon"]
    #[autocomplete = "autocomplete_weapon"]
    name: String,
) -> Result<(), Error> {
    let data = ctx.data();

    if let Some(weapon) = find_weapon_by_name(data, &name) {
        let mut embed = serenity::CreateEmbed::new()
            .title(&weapon.name)
            .description(&weapon.legend)
            .thumbnail(weapon.image_id)
            .color(get_rarity_color(&weapon.rarity))
            .footer(serenity::CreateEmbedFooter::new(EMBED_FOOTER));

        // Add special effect if present
        if !weapon.special_effect.is_empty() {
            embed = embed.field("Special Effect", &weapon.special_effect, true);
        }

        // Add shield-specific stats if applicable
        if let Some(blocking_power) = weapon.blocking_power {
            if blocking_power > 0.0 {
                embed = embed.field("Blocking Power", format!("{:.2}", blocking_power), true);
            }
        }

        if let Some(defense) = weapon.defense {
            if defense > 0 {
                embed = embed.field("Defense", defense.to_string(), true);
            }
        }

        if let Some(weight) = weapon.weight {
            if weight > 0 {
                embed = embed.field("Weight", weight.to_string(), true);
            }
        }

        // Add visual stat bars
        let damage_bar = create_weapon_stat_bar(weapon.damage, 0.9, 1.15, "🟧");
        let speed_bar = create_weapon_stat_bar(weapon.speed, 0.7, 1.2, "🟦");
        let size_bar = create_weapon_stat_bar(weapon.size, 0.75, 1.3, "🟩");

        embed = embed
            .field(
                "Damage",
                format!("{} {:.3}x", damage_bar, weapon.damage),
                false,
            )
            .field(
                "Speed",
                format!("{} {:.3}x", speed_bar, weapon.speed),
                false,
            )
            .field("Size", format!("{} {:.3}x", size_bar, weapon.size), false);

        let response = poise::CreateReply::default().embed(embed);
        ctx.send(response).await?;
    } else {
        let response = poise::CreateReply::default()
            .content("❌ Weapon not found!")
            .ephemeral(true);
        ctx.send(response).await?;
    }

    Ok(())
}

async fn autocomplete_weapon(ctx: Context<'_>, partial: &str) -> impl Iterator<Item = String> {
    let data = ctx.data();
    let weapons = data.weapons_data.read();

    weapons
        .iter()
        .filter(|weapon| weapon.name.to_lowercase().contains(&partial.to_lowercase()))
        .take(25)
        .map(|weapon| weapon.name.clone())
        .collect::<Vec<_>>()
        .into_iter()
}
