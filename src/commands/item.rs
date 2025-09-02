use crate::models::Slot;
use crate::utils::{build_item_editor_response, find_item_by_name};
use crate::{Context, Error, EMPTY_ENCHANTMENT_ID, EMPTY_MODIFIER_ID};

/// Get information about an item with interactive editor
#[poise::command(slash_command)]
pub async fn item(
    ctx: Context<'_>,
    #[description = "Name of the item"]
    #[autocomplete = "autocomplete_item"]
    name: String,
) -> Result<(), Error> {
    let data = ctx.data();
    let item = match find_item_by_name(data, &name) {
        Some(item) => item,
        None => {
            let response = poise::CreateReply::default()
                .content("❌ Item not found!")
                .ephemeral(true);
            ctx.send(response).await?;
            return Ok(());
        }
    };

    // Create initial slot with max level
    let slot = Slot {
        item: item.id.clone(),
        enchant: EMPTY_ENCHANTMENT_ID.to_string(),
        modifier: EMPTY_MODIFIER_ID.to_string(),
        gems: vec![],
        level: crate::MAX_LEVEL,
    };

    let (embed, components) = build_item_editor_response(&slot, data).await;

    let response = poise::CreateReply::default()
        .embed(embed)
        .components(components);

    ctx.send(response).await?;
    Ok(())
}

async fn autocomplete_item(ctx: Context<'_>, partial: &str) -> impl Iterator<Item = String> {
    let data = ctx.data();
    let items = data.items_data.read();

    items
        .iter()
        .filter(|item| {
            item.name.to_lowercase().contains(&partial.to_lowercase()) && item.name != "None"
        })
        .take(25)
        .map(|item| item.name.clone())
        .collect::<Vec<_>>()
        .into_iter()
}
