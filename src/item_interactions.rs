use crate::models::Slot;
use crate::{Data, Error};
use poise::serenity_prelude as serenity;
use serenity::Context;

pub async fn handle_item_interaction(
    ctx: &Context,
    interaction: &serenity::ComponentInteraction,
    data: &Data,
) -> Result<(), Error> {
    use crate::utils::{build_item_editor_response, find_item_by_id};

    let custom_id = &interaction.data.custom_id;

    // Parse current slot from embed
    let embed = &interaction.message.embeds[0];
    let slot = embed_to_slot(embed, data);

    // Check if this is a select menu interaction
    if let serenity::ComponentInteractionDataKind::StringSelect { values } = &interaction.data.kind
    {
        return handle_item_select_interaction(ctx, interaction, data, &slot, values).await;
    }

    // Handle button interactions

    match custom_id.as_str() {
        "item_add_enchant" => {
            // Create enchantment selection menu
            let mut options = vec![serenity::CreateSelectMenuOption::new(
                "None",
                crate::EMPTY_ENCHANTMENT_ID,
            )];

            {
                let enchants_list = data.enchants_list.read();
                for enchant_id in enchants_list.iter().take(24) {
                    // Discord limit of 25 options
                    let enchant = find_item_by_id(data, enchant_id);
                    options.push(serenity::CreateSelectMenuOption::new(
                        &enchant.name,
                        enchant_id,
                    ));
                }
            } // Release the read lock here

            let select_menu = serenity::CreateSelectMenu::new(
                "item_set_enchant",
                serenity::CreateSelectMenuKind::String { options },
            )
            .placeholder("Select an enchantment");

            let components = vec![
                serenity::CreateActionRow::SelectMenu(select_menu),
                serenity::CreateActionRow::Buttons(vec![serenity::CreateButton::new("item_done")
                    .style(serenity::ButtonStyle::Success)
                    .label("Done")]),
            ];

            // Convert existing embed to CreateEmbed
            let new_embed = serenity::CreateEmbed::new()
                .title(embed.title.as_ref().unwrap_or(&"Item".to_string()))
                .description(embed.description.as_ref().unwrap_or(&"".to_string()))
                .color(embed.colour.map(|c| c.0).unwrap_or(crate::DEFAULT_COLOR))
                .footer(serenity::CreateEmbedFooter::new(crate::EMBED_FOOTER));

            let new_embed = embed.fields.iter().fold(new_embed, |embed, field| {
                embed.field(&field.name, &field.value, field.inline)
            });

            interaction
                .create_response(
                    &ctx,
                    serenity::CreateInteractionResponse::UpdateMessage(
                        serenity::CreateInteractionResponseMessage::new()
                            .embed(new_embed)
                            .components(components),
                    ),
                )
                .await?;
        }
        "item_add_modifier" => {
            let item = find_item_by_id(data, &slot.item);
            let mut options = vec![serenity::CreateSelectMenuOption::new(
                "None",
                crate::EMPTY_MODIFIER_ID,
            )];

            if let Some(valid_modifiers) = &item.valid_modifiers {
                for modifier_name in valid_modifiers.iter().take(24) {
                    if let Some(modifier) = crate::utils::find_item_by_name(data, modifier_name) {
                        options.push(serenity::CreateSelectMenuOption::new(
                            &modifier.name,
                            &modifier.id,
                        ));
                    }
                }
            }

            let select_menu = serenity::CreateSelectMenu::new(
                "item_set_modifier",
                serenity::CreateSelectMenuKind::String { options },
            )
            .placeholder("Select a modifier");

            let components = vec![
                serenity::CreateActionRow::SelectMenu(select_menu),
                serenity::CreateActionRow::Buttons(vec![serenity::CreateButton::new("item_done")
                    .style(serenity::ButtonStyle::Success)
                    .label("Done")]),
            ];

            let new_embed = serenity::CreateEmbed::new()
                .title(embed.title.as_ref().unwrap_or(&"Item".to_string()))
                .description(embed.description.as_ref().unwrap_or(&"".to_string()))
                .color(embed.colour.map(|c| c.0).unwrap_or(crate::DEFAULT_COLOR))
                .footer(serenity::CreateEmbedFooter::new(crate::EMBED_FOOTER));

            let new_embed = embed.fields.iter().fold(new_embed, |embed, field| {
                embed.field(&field.name, &field.value, field.inline)
            });

            interaction
                .create_response(
                    &ctx,
                    serenity::CreateInteractionResponse::UpdateMessage(
                        serenity::CreateInteractionResponseMessage::new()
                            .embed(new_embed)
                            .components(components),
                    ),
                )
                .await?;
        }
        "item_add_gem" => {
            let item = find_item_by_id(data, &slot.item);

            if let Some(gem_slots) = item.gem_no {
                let mut options = vec![serenity::CreateSelectMenuOption::new(
                    "None",
                    crate::EMPTY_GEM_ID,
                )];

                {
                    let gems_list = data.gems_list.read();
                    for gem_id in gems_list.iter().take(24) {
                        let gem = find_item_by_id(data, gem_id);
                        options.push(serenity::CreateSelectMenuOption::new(&gem.name, gem_id));
                    }
                }

                let mut components = Vec::new();

                // Create separate select menu for each gem slot (limit to 4 to fit Discord limits)
                for i in 0..gem_slots.min(4) {
                    let placeholder = format!("Select gem for slot {}", i + 1);

                    let select_menu = serenity::CreateSelectMenu::new(
                        format!("item_set_gem_{}", i),
                        serenity::CreateSelectMenuKind::String {
                            options: options.clone(),
                        },
                    )
                    .placeholder(&placeholder);

                    components.push(serenity::CreateActionRow::SelectMenu(select_menu));
                }

                components.push(serenity::CreateActionRow::Buttons(vec![
                    serenity::CreateButton::new("item_done")
                        .style(serenity::ButtonStyle::Success)
                        .label("Done"),
                ]));

                let new_embed = serenity::CreateEmbed::new()
                    .title(embed.title.as_ref().unwrap_or(&"Item".to_string()))
                    .description(embed.description.as_ref().unwrap_or(&"".to_string()))
                    .color(embed.colour.map(|c| c.0).unwrap_or(crate::DEFAULT_COLOR))
                    .footer(serenity::CreateEmbedFooter::new(crate::EMBED_FOOTER));

                let new_embed = embed.fields.iter().fold(new_embed, |embed, field| {
                    embed.field(&field.name, &field.value, field.inline)
                });

                interaction
                    .create_response(
                        &ctx,
                        serenity::CreateInteractionResponse::UpdateMessage(
                            serenity::CreateInteractionResponseMessage::new()
                                .embed(new_embed)
                                .components(components),
                        ),
                    )
                    .await?;
            }
        }
        "item_level_down" => {
            let mut new_slot = slot.clone();

            // Ensure we don't drop below the item's minimum level.
            let item = find_item_by_id(data, &slot.item);
            let min_allowed = item.min_level.unwrap_or(10);

            new_slot.level = (new_slot.level - 10).max(min_allowed);
            let (new_embed, new_components) = build_item_editor_response(&new_slot, data).await;

            interaction
                .create_response(
                    &ctx,
                    serenity::CreateInteractionResponse::UpdateMessage(
                        serenity::CreateInteractionResponseMessage::new()
                            .embed(new_embed)
                            .components(new_components),
                    ),
                )
                .await?;
        }
        "item_level_up" => {
            let mut new_slot = slot.clone();
            new_slot.level = (new_slot.level + 10).min(crate::MAX_LEVEL);
            let (new_embed, new_components) = build_item_editor_response(&new_slot, data).await;

            interaction
                .create_response(
                    &ctx,
                    serenity::CreateInteractionResponse::UpdateMessage(
                        serenity::CreateInteractionResponseMessage::new()
                            .embed(new_embed)
                            .components(new_components),
                    ),
                )
                .await?;
        }
        "item_level_max" => {
            let mut new_slot = slot.clone();
            new_slot.level = crate::MAX_LEVEL;
            let (new_embed, new_components) = build_item_editor_response(&new_slot, data).await;

            interaction
                .create_response(
                    &ctx,
                    serenity::CreateInteractionResponse::UpdateMessage(
                        serenity::CreateInteractionResponseMessage::new()
                            .embed(new_embed)
                            .components(new_components),
                    ),
                )
                .await?;
        }
        "item_done" => {
            let stats = crate::utils::item_to_stats(&slot, data);
            let embed = serenity::CreateEmbed::new()
                .title(format!("Item Configuration Complete"))
                .description(format!(
                    "Final configuration for: **{}**",
                    find_item_by_id(data, &slot.item).name
                ))
                .color(crate::SUCCESS_COLOR)
                .field("Final Stats", format!("```\n{}\n```", stats), false)
                .footer(serenity::CreateEmbedFooter::new(crate::EMBED_FOOTER));

            interaction
                .create_response(
                    &ctx,
                    serenity::CreateInteractionResponse::UpdateMessage(
                        serenity::CreateInteractionResponseMessage::new()
                            .embed(embed)
                            .components(vec![]),
                    ),
                )
                .await?;
        }
        _ => {}
    }

    Ok(())
}

// Handle select menu interactions separately
async fn handle_item_select_interaction(
    ctx: &Context,
    interaction: &serenity::ComponentInteraction,
    data: &Data,
    slot: &Slot,
    values: &[String],
) -> Result<(), Error> {
    use crate::utils::build_item_editor_response;

    let custom_id = &interaction.data.custom_id;

    match custom_id.as_str() {
        custom_id if custom_id.starts_with("item_set_enchant") => {
            let selection = &values[0];
            let mut new_slot = slot.clone();
            new_slot.enchant = if selection == crate::EMPTY_ENCHANTMENT_ID {
                crate::EMPTY_ENCHANTMENT_ID.to_string()
            } else {
                selection.clone()
            };

            let (new_embed, new_components) = build_item_editor_response(&new_slot, data).await;

            interaction
                .create_response(
                    &ctx,
                    serenity::CreateInteractionResponse::UpdateMessage(
                        serenity::CreateInteractionResponseMessage::new()
                            .embed(new_embed)
                            .components(new_components),
                    ),
                )
                .await?;
        }
        custom_id if custom_id.starts_with("item_set_modifier") => {
            let selection = &values[0];
            let mut new_slot = slot.clone();
            new_slot.modifier = if selection == crate::EMPTY_MODIFIER_ID {
                crate::EMPTY_MODIFIER_ID.to_string()
            } else {
                selection.clone()
            };

            let (new_embed, new_components) = build_item_editor_response(&new_slot, data).await;

            interaction
                .create_response(
                    &ctx,
                    serenity::CreateInteractionResponse::UpdateMessage(
                        serenity::CreateInteractionResponseMessage::new()
                            .embed(new_embed)
                            .components(new_components),
                    ),
                )
                .await?;
        }
        custom_id if custom_id.starts_with("item_set_gem_") => {
            let gem_index = custom_id
                .trim_start_matches("item_set_gem_")
                .parse::<usize>()
                .unwrap_or(0);
            let selection = &values[0];
            let mut new_slot = slot.clone();

            // Ensure gems vector has enough capacity
            while new_slot.gems.len() <= gem_index {
                new_slot.gems.push(crate::EMPTY_GEM_ID.to_string());
            }

            new_slot.gems[gem_index] = if selection == crate::EMPTY_GEM_ID {
                crate::EMPTY_GEM_ID.to_string()
            } else {
                selection.clone()
            };

            let (new_embed, new_components) = build_item_editor_response(&new_slot, data).await;

            interaction
                .create_response(
                    &ctx,
                    serenity::CreateInteractionResponse::UpdateMessage(
                        serenity::CreateInteractionResponseMessage::new()
                            .embed(new_embed)
                            .components(new_components),
                    ),
                )
                .await?;
        }
        _ => {
            // Unknown select menu
        }
    }

    Ok(())
}

fn embed_to_slot(embed: &serenity::Embed, data: &Data) -> crate::models::Slot {
    use crate::models::Slot;
    use crate::utils::find_item_by_name;

    // Parse the embed to extract slot information
    let mut slot = Slot {
        item: String::new(),
        enchant: crate::EMPTY_ENCHANTMENT_ID.to_string(),
        modifier: crate::EMPTY_MODIFIER_ID.to_string(),
        gems: vec![],
        level: crate::MAX_LEVEL,
    };

    // Get item name from title and find item ID
    if let Some(item_name) = &embed.title {
        if let Some(item) = find_item_by_name(data, item_name) {
            slot.item = item.id;
        }
    }

    // Extract level and other information from embed fields
    for field in &embed.fields {
        match field.name.as_str() {
            "Level" => {
                if let Ok(level) = field.value.parse::<i32>() {
                    slot.level = level;
                }
            }
            "Enchantment" => {
                // Extract enchantment name from the field value (format: "emoji name")
                // Split only on the first space to handle multi-word names
                let parts: Vec<&str> = field.value.splitn(2, ' ').collect();
                if parts.len() > 1 {
                    let enchant_name = parts[1].trim();
                    if let Some(enchant) = find_item_by_name(data, enchant_name) {
                        slot.enchant = enchant.id;
                    }
                }
            }
            "Modifier" => {
                // Extract modifier name from the field value (format: "emoji name")
                // Split only on the first space to handle multi-word names
                let parts: Vec<&str> = field.value.splitn(2, ' ').collect();
                if parts.len() > 1 {
                    let modifier_name = parts[1].trim();
                    if let Some(modifier) = find_item_by_name(data, modifier_name) {
                        slot.modifier = modifier.id;
                    }
                }
            }
            "Gems" => {
                // Parse gems from the field value
                let gems_lines: Vec<&str> = field.value.lines().collect();
                slot.gems.clear();
                for line in gems_lines {
                    // Skip empty lines
                    if line.trim().is_empty() {
                        continue;
                    }

                    if line.contains("Empty Slot") {
                        slot.gems.push(crate::EMPTY_GEM_ID.to_string());
                    } else {
                        // Split only on the first space to handle multi-word names
                        let parts: Vec<&str> = line.splitn(2, ' ').collect();
                        if parts.len() > 1 {
                            let gem_name = parts[1].trim();
                            if let Some(gem) = find_item_by_name(data, gem_name) {
                                slot.gems.push(gem.id);
                            } else {
                                slot.gems.push(crate::EMPTY_GEM_ID.to_string());
                            }
                        } else {
                            slot.gems.push(crate::EMPTY_GEM_ID.to_string());
                        }
                    }
                }
            }
            _ => {}
        }
    }

    slot
}
