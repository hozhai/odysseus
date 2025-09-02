use crate::{Data, Error};
use poise::serenity_prelude as serenity;
use serenity::Context;
use std::collections::HashMap;

pub async fn handle_modal_interaction(
    ctx: &Context,
    interaction: &serenity::ModalInteraction,
    data: &Data,
) -> Result<(), Error> {
    let custom_id = &interaction.data.custom_id;
    
    match custom_id.as_str() {
        "dmgcalc_modal_attacker_submit" => {
            handle_attacker_stats_modal(ctx, interaction, data).await?;
        }
        "dmgcalc_modal_defender_submit" => {
            handle_defender_stats_modal(ctx, interaction, data).await?;
        }
        "dmgcalc_modal_affinity_submit" => {
            handle_affinity_modal(ctx, interaction, data).await?;
        }
        "dmgcalc_modal_additional_submit" => {
            handle_additional_multipliers_modal(ctx, interaction, data).await?;
        }
        _ => {
            // Unknown modal
        }
    }
    
    Ok(())
}

async fn handle_attacker_stats_modal(
    ctx: &Context,
    interaction: &serenity::ModalInteraction,
    _data: &Data,
) -> Result<(), Error> {
    let components = parse_modal_components(&interaction.data.components);
    
    let level = validate_int_field(&components, "dmgcalc_modal_level", "Level")?;
    let power = validate_int_field(&components, "dmgcalc_modal_power", "Power")?;
    let vitality = validate_int_field(&components, "dmgcalc_modal_vitality", "Vitality")?;
    
    let updated_embed = update_embed_with_field(
        &interaction.message.as_ref().unwrap().embeds[0],
        "Attacker Raw Stats",
        &format!("Level: {}\nPower: {}\nVitality: {}", level, power, vitality),
    );
    
    let components = vec![
        serenity::CreateActionRow::Buttons(vec![
            serenity::CreateButton::new("dmgcalc_defender_raw")
                .style(serenity::ButtonStyle::Primary)
                .label("Set Defender Raw Stats"),
        ]),
    ];
    
    interaction
        .create_response(
            &ctx,
            serenity::CreateInteractionResponse::UpdateMessage(
                serenity::CreateInteractionResponseMessage::new()
                    .embed(updated_embed)
                    .components(components),
            ),
        )
        .await?;
    
    Ok(())
}

async fn handle_defender_stats_modal(
    ctx: &Context,
    interaction: &serenity::ModalInteraction,
    _data: &Data,
) -> Result<(), Error> {
    let components = parse_modal_components(&interaction.data.components);
    
    let level = validate_int_field(&components, "dmgcalc_modal_def_level", "Level")?;
    let defense = validate_int_field(&components, "dmgcalc_modal_defense", "Defense")?;
    let resistance = validate_int_field(&components, "dmgcalc_modal_resistance", "Resistance")?;
    
    let updated_embed = update_embed_with_field(
        &interaction.message.as_ref().unwrap().embeds[0],
        "Defender Raw Stats",
        &format!("Level: {}\nDefense: {}\nResistance: {}", level, defense, resistance),
    );
    
    let components = vec![
        serenity::CreateActionRow::Buttons(vec![
            serenity::CreateButton::new("dmgcalc_affinity_multipliers")
                .style(serenity::ButtonStyle::Primary)
                .label("Set Affinity Multipliers"),
        ]),
    ];
    
    interaction
        .create_response(
            &ctx,
            serenity::CreateInteractionResponse::UpdateMessage(
                serenity::CreateInteractionResponseMessage::new()
                    .embed(updated_embed)
                    .components(components),
            ),
        )
        .await?;
    
    Ok(())
}

async fn handle_affinity_modal(
    ctx: &Context,
    interaction: &serenity::ModalInteraction,
    _data: &Data,
) -> Result<(), Error> {
    let components = parse_modal_components(&interaction.data.components);
    
    let base_affinity = validate_float_field(&components, "dmgcalc_modal_base_affinity", "Base Affinity")?;
    let power_affinity = validate_float_field(&components, "dmgcalc_modal_power_affinity", "Power Affinity")?;
    let damage_affinity = validate_float_field(&components, "dmgcalc_modal_damage_affinity", "Damage Affinity")?;
    
    let updated_embed = update_embed_with_field(
        &interaction.message.as_ref().unwrap().embeds[0],
        "Affinity Multipliers",
        &format!("Base Affinity: {:.2}\nPower Affinity: {:.2}\nDamage Affinity: {:.2}", 
                base_affinity, power_affinity, damage_affinity),
    );
    
    let components = vec![
        serenity::CreateActionRow::Buttons(vec![
            serenity::CreateButton::new("dmgcalc_additional_multipliers")
                .style(serenity::ButtonStyle::Primary)
                .label("Set Additional Multipliers"),
        ]),
    ];
    
    interaction
        .create_response(
            &ctx,
            serenity::CreateInteractionResponse::UpdateMessage(
                serenity::CreateInteractionResponseMessage::new()
                    .embed(updated_embed)
                    .components(components),
            ),
        )
        .await?;
    
    Ok(())
}

async fn handle_additional_multipliers_modal(
    ctx: &Context,
    interaction: &serenity::ModalInteraction,
    _data: &Data,
) -> Result<(), Error> {
    let components = parse_modal_components(&interaction.data.components);
    
    let customization = validate_float_field(&components, "dmgcalc_modal_customization", "Customization")?;
    let synergy = validate_float_field(&components, "dmgcalc_modal_synergy", "Synergy")?;
    let shape = validate_float_field(&components, "dmgcalc_modal_shape", "Shape/Embodiment")?;
    let charging = validate_float_field(&components, "dmgcalc_modal_charging", "Charging")?;
    
    let updated_embed = update_embed_with_field(
        &interaction.message.as_ref().unwrap().embeds[0],
        "Additional Multipliers",
        &format!("Customization: {:.2}\nSynergy: {:.2}\nShape/Embodiment: {:.2}\nCharging: {:.2}", 
                customization, synergy, shape, charging),
    );
    
    let components = vec![
        serenity::CreateActionRow::Buttons(vec![
            serenity::CreateButton::new("dmgcalc_calculate")
                .style(serenity::ButtonStyle::Success)
                .label("Calculate Damage"),
        ]),
    ];
    
    interaction
        .create_response(
            &ctx,
            serenity::CreateInteractionResponse::UpdateMessage(
                serenity::CreateInteractionResponseMessage::new()
                    .embed(updated_embed)
                    .components(components),
            ),
        )
        .await?;
    
    Ok(())
}

// Helper functions for modal processing
fn parse_modal_components(action_rows: &[serenity::ActionRow]) -> HashMap<String, String> {
    let mut components = HashMap::new();
    
    for row in action_rows {
        for component in &row.components {
            if let serenity::ActionRowComponent::InputText(input) = component {
                if let Some(value) = &input.value {
                    components.insert(input.custom_id.clone(), value.clone());
                }
            }
        }
    }
    
    components
}

fn validate_int_field(components: &HashMap<String, String>, field_id: &str, field_name: &str) -> Result<i32, Error> {
    if let Some(value_str) = components.get(field_id) {
        let value = value_str.trim().parse::<i32>()
            .map_err(|_| format!("{} must be a valid integer", field_name))?;
        
        if value < 0 {
            return Err(format!("{} must be non-negative", field_name).into());
        }
        
        Ok(value)
    } else {
        Err(format!("{} field not found", field_name).into())
    }
}

fn validate_float_field(components: &HashMap<String, String>, field_id: &str, field_name: &str) -> Result<f64, Error> {
    if let Some(value_str) = components.get(field_id) {
        let value = value_str.trim().parse::<f64>()
            .map_err(|_| format!("{} must be a valid number", field_name))?;
        
        if value < 0.0 {
            return Err(format!("{} must be non-negative", field_name).into());
        }
        
        Ok(value)
    } else {
        Err(format!("{} field not found", field_name).into())
    }
}

fn update_embed_with_field(old_embed: &serenity::Embed, field_name: &str, field_value: &str) -> serenity::CreateEmbed {
    let mut new_embed = serenity::CreateEmbed::new()
        .title(old_embed.title.as_ref().unwrap_or(&"Damage Calculator".to_string()))
        .color(old_embed.colour.map(|c| c.0).unwrap_or(crate::DEFAULT_COLOR))
        .footer(serenity::CreateEmbedFooter::new(crate::EMBED_FOOTER));
    
    if let Some(author) = &old_embed.author {
        new_embed = new_embed.author(serenity::CreateEmbedAuthor::new(&author.name));
    }
    
    if let Some(description) = &old_embed.description {
        new_embed = new_embed.description(description);
    }
    
    // Add existing fields
    for field in &old_embed.fields {
        new_embed = new_embed.field(&field.name, &field.value, field.inline);
    }
    
    // Add new field
    new_embed = new_embed.field(field_name, field_value, true);
    
    new_embed
}
