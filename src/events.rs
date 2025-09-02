use crate::{Data, Error, DEFAULT_COLOR, EMBED_FOOTER};
use poise::serenity_prelude as serenity;
use serenity::{Context, FullEvent};
use tracing::{error, info};

pub async fn event_handler(
    ctx: &Context,
    event: &FullEvent,
    _framework: poise::FrameworkContext<'_, Data, Error>,
    data: &Data,
) -> Result<(), Error> {
    match event {
        FullEvent::Ready { data_about_bot, .. } => {
            info!(
                "Logged in as {} ({})",
                data_about_bot.user.name, data_about_bot.user.id
            );

            // Set bot activity
            ctx.set_activity(Some(serenity::ActivityData::playing("Arcane Odyssey")));
        }
        FullEvent::InteractionCreate { interaction } => {
            if let serenity::Interaction::Component(component) = interaction {
                if let Err(e) = handle_component_interaction(ctx, component, data).await {
                    error!("Error handling component interaction: {}", e);
                }
            } else if let serenity::Interaction::Modal(modal) = interaction {
                if let Err(e) =
                    crate::modal_interactions::handle_modal_interaction(ctx, modal, data).await
                {
                    error!("Error handling modal interaction: {}", e);
                }
            }
        }
        _ => {}
    }
    Ok(())
}

async fn handle_component_interaction(
    ctx: &Context,
    interaction: &serenity::ComponentInteraction,
    data: &Data,
) -> Result<(), Error> {
    let custom_id = &interaction.data.custom_id;

    match custom_id.as_str() {
        "dmgcalc_attacker_raw" => {
            let modal =
                serenity::CreateModal::new("dmgcalc_modal_attacker_submit", "Attacker Raw Stats")
                    .components(vec![
                        serenity::CreateActionRow::InputText(
                            serenity::CreateInputText::new(
                                serenity::InputTextStyle::Short,
                                "Level",
                                "dmgcalc_modal_level",
                            )
                            .placeholder("140")
                            .required(true),
                        ),
                        serenity::CreateActionRow::InputText(
                            serenity::CreateInputText::new(
                                serenity::InputTextStyle::Short,
                                "Power",
                                "dmgcalc_modal_power",
                            )
                            .placeholder("100")
                            .required(true),
                        ),
                        serenity::CreateActionRow::InputText(
                            serenity::CreateInputText::new(
                                serenity::InputTextStyle::Short,
                                "Vitality",
                                "dmgcalc_modal_vitality",
                            )
                            .placeholder("0")
                            .required(true),
                        ),
                    ]);

            interaction
                .create_response(&ctx, serenity::CreateInteractionResponse::Modal(modal))
                .await?;
        }
        "dmgcalc_defender_raw" => {
            let modal =
                serenity::CreateModal::new("dmgcalc_modal_defender_submit", "Defender Raw Stats")
                    .components(vec![
                        serenity::CreateActionRow::InputText(
                            serenity::CreateInputText::new(
                                serenity::InputTextStyle::Short,
                                "Level",
                                "dmgcalc_modal_def_level",
                            )
                            .placeholder("140")
                            .required(true),
                        ),
                        serenity::CreateActionRow::InputText(
                            serenity::CreateInputText::new(
                                serenity::InputTextStyle::Short,
                                "Defense",
                                "dmgcalc_modal_defense",
                            )
                            .placeholder("0")
                            .required(true),
                        ),
                        serenity::CreateActionRow::InputText(
                            serenity::CreateInputText::new(
                                serenity::InputTextStyle::Short,
                                "Resistance",
                                "dmgcalc_modal_resistance",
                            )
                            .placeholder("0")
                            .required(true),
                        ),
                    ]);

            interaction
                .create_response(&ctx, serenity::CreateInteractionResponse::Modal(modal))
                .await?;
        }
        "dmgcalc_affinity_multipliers" => {
            let modal =
                serenity::CreateModal::new("dmgcalc_modal_affinity_submit", "Affinity Multipliers")
                    .components(vec![
                        serenity::CreateActionRow::InputText(
                            serenity::CreateInputText::new(
                                serenity::InputTextStyle::Short,
                                "Base Affinity",
                                "dmgcalc_modal_base_affinity",
                            )
                            .placeholder("1.0")
                            .required(true),
                        ),
                        serenity::CreateActionRow::InputText(
                            serenity::CreateInputText::new(
                                serenity::InputTextStyle::Short,
                                "Power Affinity",
                                "dmgcalc_modal_power_affinity",
                            )
                            .placeholder("1.0")
                            .required(true),
                        ),
                        serenity::CreateActionRow::InputText(
                            serenity::CreateInputText::new(
                                serenity::InputTextStyle::Short,
                                "Damage Affinity",
                                "dmgcalc_modal_damage_affinity",
                            )
                            .placeholder("1.0")
                            .required(true),
                        ),
                    ]);

            interaction
                .create_response(&ctx, serenity::CreateInteractionResponse::Modal(modal))
                .await?;
        }
        "dmgcalc_additional_multipliers" => {
            let modal = serenity::CreateModal::new(
                "dmgcalc_modal_additional_submit",
                "Additional Multipliers",
            )
            .components(vec![
                serenity::CreateActionRow::InputText(
                    serenity::CreateInputText::new(
                        serenity::InputTextStyle::Short,
                        "[Magic/FS Only] Customization",
                        "dmgcalc_modal_customization",
                    )
                    .placeholder("1.0")
                    .required(true),
                ),
                serenity::CreateActionRow::InputText(
                    serenity::CreateInputText::new(
                        serenity::InputTextStyle::Short,
                        "Synergy",
                        "dmgcalc_modal_synergy",
                    )
                    .placeholder("1.0")
                    .required(true),
                ),
                serenity::CreateActionRow::InputText(
                    serenity::CreateInputText::new(
                        serenity::InputTextStyle::Short,
                        "[Magic/FS Only] Shape/Embodiment",
                        "dmgcalc_modal_shape",
                    )
                    .placeholder("1.1-0.9")
                    .required(true),
                ),
                serenity::CreateActionRow::InputText(
                    serenity::CreateInputText::new(
                        serenity::InputTextStyle::Short,
                        "Charging",
                        "dmgcalc_modal_charging",
                    )
                    .placeholder("1.0-1.33")
                    .required(true),
                ),
            ]);

            interaction
                .create_response(&ctx, serenity::CreateInteractionResponse::Modal(modal))
                .await?;
        }
        "dmgcalc_calculate" => {
            calculate_damage(ctx, interaction).await?;
        }
        custom_id if custom_id.starts_with("sort_prev_") || custom_id.starts_with("sort_next_") => {
            handle_sort_pagination(ctx, interaction, data).await?;
        }
        custom_id if custom_id.starts_with("item_") => {
            crate::item_interactions::handle_item_interaction(ctx, interaction, data).await?;
        }
        _ => {}
    }

    Ok(())
}

// async fn handle_modal_interaction(
//     ctx: &Context,
//     interaction: &serenity::ModalInteraction,
// ) -> Result<(), Error> {
//     let custom_id = &interaction.data.custom_id;

//     match custom_id.as_str() {
//         "dmgcalc_modal_attacker_submit" => {
//             handle_attacker_stats_modal(ctx, interaction).await?;
//         }
//         "dmgcalc_modal_defender_submit" => {
//             handle_defender_stats_modal(ctx, interaction).await?;
//         }
//         "dmgcalc_modal_affinity_submit" => {
//             handle_affinity_modal(ctx, interaction).await?;
//         }
//         "dmgcalc_modal_additional_submit" => {
//             handle_additional_modal(ctx, interaction).await?;
//         }
//         _ => {}
//     }

//     Ok(())
// }

// // Helper functions for damage calculator
// fn validate_int_field(
//     components: &[serenity::ActionRow],
//     field_id: &str,
//     field_name: &str,
// ) -> Result<i32, String> {
//     for action_row in components {
//         for component in &action_row.components {
//             if let serenity::ActionRowComponent::InputText(text_input) = component {
//                 if text_input.custom_id == field_id {
//                     if let Some(ref value) = text_input.value {
//                         let value_str = value.trim();
//                         return value_str
//                             .parse::<i32>()
//                             .map_err(|_| format!("{} must be a valid number", field_name))
//                             .and_then(|val| {
//                                 if val < 0 {
//                                     Err(format!("{} must be non-negative", field_name))
//                                 } else {
//                                     Ok(val)
//                                 }
//                             });
//                     }
//                 }
//             }
//         }
//     }
//     Err(format!("{} field not found", field_name))
// }

// fn validate_float_field(
//     components: &[serenity::ActionRow],
//     field_id: &str,
//     field_name: &str,
// ) -> Result<f64, String> {
//     for action_row in components {
//         for component in &action_row.components {
//             if let serenity::ActionRowComponent::InputText(text_input) = component {
//                 if text_input.custom_id == field_id {
//                     if let Some(ref value) = text_input.value {
//                         let value_str = value.trim();
//                         return value_str
//                             .parse::<f64>()
//                             .map_err(|_| format!("{} must be a valid decimal number", field_name))
//                             .and_then(|val| {
//                                 if val < 0.0 {
//                                     Err(format!("{} must be non-negative", field_name))
//                                 } else {
//                                     Ok(val)
//                                 }
//                             });
//                     }
//                 }
//             }
//         }
//     }
//     Err(format!("{} field not found", field_name))
// }

// async fn handle_attacker_stats_modal(
//     ctx: &Context,
//     interaction: &serenity::ModalInteraction,
// ) -> Result<(), Error> {
//     let components = &interaction.data.components;
//     let level = validate_int_field(components, "dmgcalc_modal_level", "Level");
//     let power = validate_int_field(components, "dmgcalc_modal_power", "Power");
//     let vitality = validate_int_field(components, "dmgcalc_modal_vitality", "Vitality");

//     let mut errors = Vec::new();
//     let mut level_val = 0;
//     let mut power_val = 0;
//     let mut vitality_val = 0;

//     if let Err(e) = level {
//         errors.push(e);
//     } else {
//         level_val = level.unwrap();
//     }

//     if let Err(e) = power {
//         errors.push(e);
//     } else {
//         power_val = power.unwrap();
//     }

//     if let Err(e) = vitality {
//         errors.push(e);
//     } else {
//         vitality_val = vitality.unwrap();
//     }

//     if !errors.is_empty() {
//         let error_msg = format!("❌ **Validation Errors:**\n• {}", errors.join("\n• "));
//         interaction
//             .create_response(
//                 &ctx,
//                 serenity::CreateInteractionResponse::Message(
//                     serenity::CreateInteractionResponseMessage::new()
//                         .content(error_msg)
//                         .ephemeral(true),
//                 ),
//             )
//             .await?;
//         return Ok(());
//     }

//     // Update embed with attacker stats
//     let old_embed = &interaction.message.as_ref().unwrap().embeds[0];
//     let mut embed = serenity::CreateEmbed::new()
//         .title(old_embed.title.as_ref().unwrap().clone())
//         .description(old_embed.description.as_ref().unwrap().clone())
//         .color(DEFAULT_COLOR)
//         .footer(serenity::CreateEmbedFooter::new(EMBED_FOOTER))
//         .author(serenity::CreateEmbedAuthor::new(
//             &old_embed.author.as_ref().unwrap().name,
//         ));

//     // Add existing fields
//     for field in &old_embed.fields {
//         embed = embed.field(&field.name, &field.value, field.inline);
//     }

//     // Add new field
//     embed = embed.field(
//         "Attacker Raw Stats",
//         format!(
//             "Level: {}\nPower: {}\nVitality: {}",
//             level_val, power_val, vitality_val
//         ),
//         true,
//     );

//     let components = vec![serenity::CreateActionRow::Buttons(vec![
//         serenity::CreateButton::new("dmgcalc_defender_raw")
//             .style(serenity::ButtonStyle::Primary)
//             .label("Set Defender Raw Stats"),
//     ])];

//     interaction
//         .create_response(
//             &ctx,
//             serenity::CreateInteractionResponse::UpdateMessage(
//                 serenity::CreateInteractionResponseMessage::new()
//                     .embed(embed)
//                     .components(components),
//             ),
//         )
//         .await?;

//     Ok(())
// }

// async fn handle_defender_stats_modal(
//     ctx: &Context,
//     interaction: &serenity::ModalInteraction,
// ) -> Result<(), Error> {
//     let components = &interaction.data.components;
//     let level = validate_int_field(components, "dmgcalc_modal_def_level", "Level");
//     let defense = validate_int_field(components, "dmgcalc_modal_defense", "Defense");
//     let resistance = validate_int_field(components, "dmgcalc_modal_resistance", "Resistance");

//     let mut errors = Vec::new();
//     let mut level_val = 0;
//     let mut defense_val = 0;
//     let mut resistance_val = 0;

//     if let Err(e) = level {
//         errors.push(e);
//     } else {
//         level_val = level.unwrap();
//     }

//     if let Err(e) = defense {
//         errors.push(e);
//     } else {
//         defense_val = defense.unwrap();
//     }

//     if let Err(e) = resistance {
//         errors.push(e);
//     } else {
//         resistance_val = resistance.unwrap();
//     }

//     if !errors.is_empty() {
//         let error_msg = format!("❌ **Validation Errors:**\n• {}", errors.join("\n• "));
//         interaction
//             .create_response(
//                 &ctx,
//                 serenity::CreateInteractionResponse::Message(
//                     serenity::CreateInteractionResponseMessage::new()
//                         .content(error_msg)
//                         .ephemeral(true),
//                 ),
//             )
//             .await?;
//         return Ok(());
//     }

//     // Update embed with defender stats
//     let old_embed = &interaction.message.as_ref().unwrap().embeds[0];
//     let mut embed = serenity::CreateEmbed::new()
//         .title(old_embed.title.as_ref().unwrap().clone())
//         .description(old_embed.description.as_ref().unwrap().clone())
//         .color(DEFAULT_COLOR)
//         .footer(serenity::CreateEmbedFooter::new(EMBED_FOOTER))
//         .author(serenity::CreateEmbedAuthor::new(
//             &old_embed.author.as_ref().unwrap().name,
//         ));

//     // Add existing fields
//     for field in &old_embed.fields {
//         embed = embed.field(&field.name, &field.value, field.inline);
//     }

//     // Add new field
//     embed = embed.field(
//         "Defender Raw Stats",
//         format!(
//             "Level: {}\nDefense: {}\nResistance: {}",
//             level_val, defense_val, resistance_val
//         ),
//         true,
//     );

//     let components = vec![serenity::CreateActionRow::Buttons(vec![
//         serenity::CreateButton::new("dmgcalc_affinity_multipliers")
//             .style(serenity::ButtonStyle::Primary)
//             .label("Set Affinity Multipliers"),
//     ])];

//     interaction
//         .create_response(
//             &ctx,
//             serenity::CreateInteractionResponse::UpdateMessage(
//                 serenity::CreateInteractionResponseMessage::new()
//                     .embed(embed)
//                     .components(components),
//             ),
//         )
//         .await?;

//     Ok(())
// }

// async fn handle_affinity_modal(
//     ctx: &Context,
//     interaction: &serenity::ModalInteraction,
// ) -> Result<(), Error> {
//     let components = &interaction.data.components;
//     let base_affinity =
//         validate_float_field(components, "dmgcalc_modal_base_affinity", "Base Affinity");
//     let power_affinity =
//         validate_float_field(components, "dmgcalc_modal_power_affinity", "Power Affinity");
//     let damage_affinity = validate_float_field(
//         components,
//         "dmgcalc_modal_damage_affinity",
//         "Damage Affinity",
//     );

//     let mut errors = Vec::new();
//     let mut base_val = 0.0;
//     let mut power_val = 0.0;
//     let mut damage_val = 0.0;

//     if let Err(e) = base_affinity {
//         errors.push(e);
//     } else {
//         base_val = base_affinity.unwrap();
//     }

//     if let Err(e) = power_affinity {
//         errors.push(e);
//     } else {
//         power_val = power_affinity.unwrap();
//     }

//     if let Err(e) = damage_affinity {
//         errors.push(e);
//     } else {
//         damage_val = damage_affinity.unwrap();
//     }

//     if !errors.is_empty() {
//         let error_msg = format!("❌ **Validation Errors:**\n• {}", errors.join("\n• "));
//         interaction
//             .create_response(
//                 &ctx,
//                 serenity::CreateInteractionResponse::Message(
//                     serenity::CreateInteractionResponseMessage::new()
//                         .content(error_msg)
//                         .ephemeral(true),
//                 ),
//             )
//             .await?;
//         return Ok(());
//     }

//     // Update embed with affinity multipliers
//     let old_embed = &interaction.message.as_ref().unwrap().embeds[0];
//     let mut embed = serenity::CreateEmbed::new()
//         .title(old_embed.title.as_ref().unwrap().clone())
//         .description(old_embed.description.as_ref().unwrap().clone())
//         .color(DEFAULT_COLOR)
//         .footer(serenity::CreateEmbedFooter::new(EMBED_FOOTER))
//         .author(serenity::CreateEmbedAuthor::new(
//             &old_embed.author.as_ref().unwrap().name,
//         ));

//     // Add existing fields
//     for field in &old_embed.fields {
//         embed = embed.field(&field.name, &field.value, field.inline);
//     }

//     // Add new field
//     embed = embed.field(
//         "Affinity Multipliers",
//         format!(
//             "Base Affinity: {:.2}\nPower Affinity: {:.2}\nDamage Affinity: {:.2}",
//             base_val, power_val, damage_val
//         ),
//         true,
//     );

//     let components = vec![serenity::CreateActionRow::Buttons(vec![
//         serenity::CreateButton::new("dmgcalc_additional_multipliers")
//             .style(serenity::ButtonStyle::Primary)
//             .label("Set Additional Multipliers"),
//     ])];

//     interaction
//         .create_response(
//             &ctx,
//             serenity::CreateInteractionResponse::UpdateMessage(
//                 serenity::CreateInteractionResponseMessage::new()
//                     .embed(embed)
//                     .components(components),
//             ),
//         )
//         .await?;

//     Ok(())
// }

// async fn handle_additional_modal(
//     ctx: &Context,
//     interaction: &serenity::ModalInteraction,
// ) -> Result<(), Error> {
//     let components = &interaction.data.components;
//     let customization =
//         validate_float_field(components, "dmgcalc_modal_customization", "Customization");
//     let synergy = validate_float_field(components, "dmgcalc_modal_synergy", "Synergy");
//     let shape = validate_float_field(components, "dmgcalc_modal_shape", "Shape/Embodiment");
//     let charging = validate_float_field(components, "dmgcalc_modal_charging", "Charging");

//     let mut errors = Vec::new();
//     let mut customization_val = 0.0;
//     let mut synergy_val = 0.0;
//     let mut shape_val = 0.0;
//     let mut charging_val = 0.0;

//     if let Err(e) = customization {
//         errors.push(e);
//     } else {
//         customization_val = customization.unwrap();
//     }

//     if let Err(e) = synergy {
//         errors.push(e);
//     } else {
//         synergy_val = synergy.unwrap();
//     }

//     if let Err(e) = shape {
//         errors.push(e);
//     } else {
//         shape_val = shape.unwrap();
//     }

//     if let Err(e) = charging {
//         errors.push(e);
//     } else {
//         charging_val = charging.unwrap();
//     }

//     if !errors.is_empty() {
//         let error_msg = format!("❌ **Validation Errors:**\n• {}", errors.join("\n• "));
//         interaction
//             .create_response(
//                 &ctx,
//                 serenity::CreateInteractionResponse::Message(
//                     serenity::CreateInteractionResponseMessage::new()
//                         .content(error_msg)
//                         .ephemeral(true),
//                 ),
//             )
//             .await?;
//         return Ok(());
//     }

//     // Update embed with additional multipliers
//     let old_embed = &interaction.message.as_ref().unwrap().embeds[0];
//     let mut embed = serenity::CreateEmbed::new()
//         .title(old_embed.title.as_ref().unwrap().clone())
//         .description(old_embed.description.as_ref().unwrap().clone())
//         .color(DEFAULT_COLOR)
//         .footer(serenity::CreateEmbedFooter::new(EMBED_FOOTER))
//         .author(serenity::CreateEmbedAuthor::new(
//             &old_embed.author.as_ref().unwrap().name,
//         ));

//     // Add existing fields
//     for field in &old_embed.fields {
//         embed = embed.field(&field.name, &field.value, field.inline);
//     }

//     // Add new field
//     embed = embed.field(
//         "Additional Multipliers",
//         format!(
//             "Customization: {:.2}\nSynergy: {:.2}\nShape/Embodiment: {:.2}\nCharging: {:.2}",
//             customization_val, synergy_val, shape_val, charging_val
//         ),
//         true,
//     );

//     let components = vec![serenity::CreateActionRow::Buttons(vec![
//         serenity::CreateButton::new("dmgcalc_calculate")
//             .style(serenity::ButtonStyle::Success)
//             .label("Calculate"),
//     ])];

//     interaction
//         .create_response(
//             &ctx,
//             serenity::CreateInteractionResponse::UpdateMessage(
//                 serenity::CreateInteractionResponseMessage::new()
//                     .embed(embed)
//                     .components(components),
//             ),
//         )
//         .await?;

//     Ok(())
// }

async fn calculate_damage(
    ctx: &Context,
    interaction: &serenity::ComponentInteraction,
) -> Result<(), Error> {
    let embed = &interaction.message.embeds[0];
    let fields = &embed.fields;

    let mut attacker_level = 0;
    let mut attacker_power = 0;
    let mut attacker_vitality = 0;
    let mut base_affinity = 0.0;
    let mut power_affinity = 0.0;
    let mut damage_affinity = 0.0;
    let mut customization = 0.0;
    let mut synergy = 0.0;
    let mut shape = 0.0;
    let mut charging = 0.0;

    // Parse existing fields
    for field in fields {
        match field.name.as_str() {
            "Attacker Raw Stats" => {
                for line in field.value.lines() {
                    if let Some((key, value)) = line.split_once(": ") {
                        let val = value.trim();
                        match key {
                            "Level" => attacker_level = val.parse().unwrap_or(0),
                            "Power" => attacker_power = val.parse().unwrap_or(0),
                            "Vitality" => attacker_vitality = val.parse().unwrap_or(0),
                            _ => {}
                        }
                    }
                }
            }
            "Affinity Multipliers" => {
                for line in field.value.lines() {
                    if let Some((key, value)) = line.split_once(": ") {
                        let val = value.trim();
                        match key {
                            "Base Affinity" => base_affinity = val.parse().unwrap_or(0.0),
                            "Power Affinity" => power_affinity = val.parse().unwrap_or(0.0),
                            "Damage Affinity" => damage_affinity = val.parse().unwrap_or(0.0),
                            _ => {}
                        }
                    }
                }
            }
            "Additional Multipliers" => {
                for line in field.value.lines() {
                    if let Some((key, value)) = line.split_once(": ") {
                        let val = value.trim();
                        match key {
                            "Customization" => customization = val.parse().unwrap_or(0.0),
                            "Synergy" => synergy = val.parse().unwrap_or(0.0),
                            "Shape/Embodiment" => shape = val.parse().unwrap_or(0.0),
                            "Charging" => charging = val.parse().unwrap_or(0.0),
                            _ => {}
                        }
                    }
                }
            }
            _ => {}
        }
    }

    // Calculate damage using the original formulas
    let base_ability_damage = (base_affinity * (19.0 + attacker_level as f64)) as i32;
    let power_ability_damage = (power_affinity * attacker_power as f64) as i32;
    let pre_multiplier_damage = base_ability_damage + power_ability_damage;

    let base_hp = 93 + 7 * attacker_level;
    let max_hp = base_hp + 4 * attacker_vitality;

    let damage =
        (base_hp as f64 / max_hp as f64).sqrt() * damage_affinity * pre_multiplier_damage as f64;
    let raw_simple_damage = (base_hp as f64 / max_hp as f64).sqrt()
        * (damage_affinity
            * ((19.0 + attacker_level as f64) * base_affinity
                + (attacker_power as f64 * power_affinity)));

    let total_multiplier = customization * synergy * shape * charging;
    let final_damage = damage * total_multiplier;

    // Create result embed
    let result_embed = serenity::CreateEmbed::new()
        .title("🎯 Damage Calculation Results")
        .author(serenity::CreateEmbedAuthor::new(
            &embed.author.as_ref().unwrap().name,
        ))
        .field("Base Ability Damage", base_ability_damage.to_string(), true)
        .field(
            "Power Ability Damage",
            power_ability_damage.to_string(),
            true,
        )
        .field(
            "Pre-Multiplier Damage",
            pre_multiplier_damage.to_string(),
            true,
        )
        .field("Damage", format!("{:.2}", damage), true)
        .field(
            "Raw Simple Damage",
            format!("{:.2}", raw_simple_damage),
            true,
        )
        .field("Final Damage", format!("{:.2}", final_damage), true)
        .color(DEFAULT_COLOR)
        .footer(serenity::CreateEmbedFooter::new(EMBED_FOOTER));

    interaction
        .create_response(
            &ctx,
            serenity::CreateInteractionResponse::UpdateMessage(
                serenity::CreateInteractionResponseMessage::new()
                    .embed(result_embed)
                    .components(vec![]), // Clear all components
            ),
        )
        .await?;

    Ok(())
}

async fn handle_sort_pagination(
    ctx: &Context,
    interaction: &serenity::ComponentInteraction,
    data: &Data,
) -> Result<(), Error> {
    use crate::commands::{build_pagination_components, build_sort_embed};
    use crate::utils::filter_and_sort_items;

    let custom_id = &interaction.data.custom_id;
    let parts: Vec<&str> = custom_id.split('_').collect();

    if parts.len() < 5 {
        return Ok(());
    }

    let action = parts[1]; // "prev" or "next"
    let stat_type = parts[2];
    let item_type = if parts[3].is_empty() {
        None
    } else {
        Some(parts[3])
    };
    let current_page: usize = parts[4].parse().unwrap_or(1);

    // Calculate new page
    let new_page = match action {
        "prev" => current_page.saturating_sub(1).max(1),
        "next" => current_page + 1,
        _ => return Ok(()),
    };

    // Get data and rebuild the sorted items
    let sortable_items = filter_and_sort_items(data, stat_type, item_type).await;

    let total_pages = ((sortable_items.len() as f64) / 10.0).ceil() as usize;

    // Validate new page
    let validated_page = new_page.min(total_pages).max(1);

    // Build new embed and components
    let embed = build_sort_embed(
        &sortable_items,
        stat_type,
        item_type,
        validated_page,
        total_pages,
    );
    let components = build_pagination_components(validated_page, total_pages, stat_type, item_type);

    interaction
        .create_response(
            &ctx,
            serenity::CreateInteractionResponse::UpdateMessage(
                serenity::CreateInteractionResponseMessage::new()
                    .embed(embed)
                    .components(components),
            ),
        )
        .await?;

    Ok(())
}
