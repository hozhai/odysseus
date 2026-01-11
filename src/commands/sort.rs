use crate::utils::{filter_and_sort_items, get_stat_display_name, get_type_filter, SortableItem};
use crate::{Context, Error, DEFAULT_COLOR, EMBED_FOOTER};
use poise::serenity_prelude as serenity;
use serenity::builder::CreateEmbed;

/// Sort and display items by specific stats
#[poise::command(slash_command)]
pub async fn sort(
    ctx: Context<'_>,
    #[description = "The stat to sort by"]
    #[autocomplete = "stat_autocomplete"]
    stat: String,
    #[description = "Filter by item type (optional)"]
    #[autocomplete = "item_type_autocomplete"]
    item_type: Option<String>,
) -> Result<(), Error> {
    let data = ctx.data();

    // Validate stat type
    let valid_stats = [
        "power",
        "agility",
        "attackspeed",
        "defense",
        "attacksize",
        "intensity",
        "regeneration",
        "resistance",
        "armorpiercing",
    ];

    if !valid_stats.contains(&stat.as_str()) {
        ctx.say(format!(
            "Invalid stat type! Valid stats are: {}",
            valid_stats.join(", ")
        ))
        .await?;
        return Ok(());
    }

    // Filter and sort items
    let sortable_items = filter_and_sort_items(data, &stat, item_type.as_deref()).await;

    if sortable_items.is_empty() {
        let type_filter = get_type_filter(item_type.as_deref());
        ctx.say(format!(
            "No items found with {} stats{}.",
            stat, type_filter
        ))
        .await?;
        return Ok(());
    }

    let total_pages = ((sortable_items.len() as f64) / 10.0).ceil() as usize;
    let current_page = 1;

    let embed = build_sort_embed(
        &sortable_items,
        &stat,
        item_type.as_deref(),
        current_page,
        total_pages,
    );
    let components =
        build_pagination_components(current_page, total_pages, &stat, item_type.as_deref());

    ctx.send(
        poise::CreateReply::default()
            .embed(embed)
            .components(components),
    )
    .await?;

    Ok(())
}

// Autocomplete functions for sort command
pub async fn stat_autocomplete(_ctx: Context<'_>, partial: &str) -> Vec<String> {
    let stats = [
        ("power", "Power"),
        ("agility", "Agility"),
        ("attackspeed", "Attack Speed"),
        ("defense", "Defense"),
        ("attacksize", "Attack Size"),
        ("intensity", "Intensity"),
        ("regeneration", "Regeneration"),
        ("resistance", "Resistance"),
        ("armorpiercing", "Armor Piercing"),
    ];

    stats
        .iter()
        .filter(|(value, name)| {
            value.contains(&partial.to_lowercase())
                || name.to_lowercase().contains(&partial.to_lowercase())
        })
        .map(|(value, _name)| (*value).to_string())
        .collect()
}

pub async fn item_type_autocomplete(ctx: Context<'_>, partial: &str) -> Vec<String> {
    let data = ctx.data();
    let items_data = data.items_data.read();

    let mut types = std::collections::HashSet::new();
    for item in items_data.iter() {
        if !item.deleted && item.name != "None" {
            types.insert(item.main_type.clone());
        }
    }

    let mut type_vec: Vec<String> = types.into_iter().collect();
    type_vec.sort();

    type_vec
        .into_iter()
        .filter(|t| t.to_lowercase().contains(&partial.to_lowercase()))
        .take(25) // Discord limits to 25 choices
        .collect()
}

// Helper functions for sort command
pub fn build_sort_embed(
    sortable_items: &[SortableItem],
    stat_type: &str,
    item_type: Option<&str>,
    current_page: usize,
    total_pages: usize,
) -> CreateEmbed {
    let items_per_page = 10;
    let start_index = (current_page - 1) * items_per_page;
    let end_index = (start_index + items_per_page).min(sortable_items.len());

    let page_items = &sortable_items[start_index..end_index];

    let type_filter = get_type_filter(item_type);
    let stat_display = get_stat_display_name(stat_type);

    let mut description = format!(
        "Items sorted by {} at level 170{}\n\n",
        stat_display, type_filter
    );

    for (i, sortable_item) in page_items.iter().enumerate() {
        let rank = start_index + i + 1;
        let item = &sortable_item.item;

        description.push_str(&format!("**{}.** {}\n", rank, item.name));
        description.push_str(&format!(
            "   {}: **{}** | {}",
            stat_display, sortable_item.value, item.rarity
        ));

        if let Some(sub_type) = &item.sub_type {
            if !sub_type.is_empty() {
                description.push_str(&format!(" | {}", sub_type));
            }
        }

        description.push_str("\n\n");
    }

    CreateEmbed::new()
        .title(format!("Top Items by {}", stat_display))
        .description(description)
        .color(DEFAULT_COLOR)
        .footer(serenity::CreateEmbedFooter::new(format!(
            "Page {}/{} • {}",
            current_page, total_pages, EMBED_FOOTER
        )))
        .timestamp(serenity::Timestamp::now())
}

pub fn build_pagination_components(
    current_page: usize,
    total_pages: usize,
    stat_type: &str,
    item_type: Option<&str>,
) -> Vec<serenity::CreateActionRow> {
    let item_type_str = item_type.unwrap_or("");

    let mut prev_button = serenity::CreateButton::new(format!(
        "sort_prev_{}_{}_{}",
        stat_type, item_type_str, current_page
    ))
    .style(serenity::ButtonStyle::Secondary)
    .label("◀ Prev");

    if current_page <= 1 {
        prev_button = prev_button.disabled(true);
    }

    let page_button = serenity::CreateButton::new("sort_page_indicator")
        .style(serenity::ButtonStyle::Secondary)
        .label(format!("Page {}/{}", current_page, total_pages))
        .disabled(true);

    let mut next_button = serenity::CreateButton::new(format!(
        "sort_next_{}_{}_{}",
        stat_type, item_type_str, current_page
    ))
    .style(serenity::ButtonStyle::Secondary)
    .label("Next ▶");

    if current_page >= total_pages {
        next_button = next_button.disabled(true);
    }

    vec![serenity::CreateActionRow::Buttons(vec![
        prev_button,
        page_button,
        next_button,
    ])]
}
