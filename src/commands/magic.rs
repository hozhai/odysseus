use crate::{
    utils::{find_magic_by_name, magic_string_into_emoji},
    Context, Error, DEFAULT_COLOR, EMBED_FOOTER,
};
use poise::serenity_prelude as serenity;

/// Get information about a magic
#[poise::command(slash_command)]
pub async fn magic(
    ctx: Context<'_>,
    #[description = "Name of the magic"]
    #[autocomplete = "autocomplete_magic"]
    magic: String,
) -> Result<(), Error> {
    let data = ctx.data();

    if let Some(magic) = find_magic_by_name(data, &magic) {
        let embed = serenity::CreateEmbed::new()
            .title(&magic.name)
            .description(&magic.legend)
            .thumbnail(magic.image_id)
            .field("Special Effect", &magic.special_effect, true)
            .field(
                "Unimbued Stats",
                format!(
                    "<:power:1392363667059904632> {}x\n <:attackspeed:1392364933722804274> {}x\n <:attacksize:1392364917616807956> {}x",
                    &magic.unimbued.damage, &magic.unimbued.speed, &magic.unimbued.size
                ),
                true,
            )
            .field(
              "Imbued Stats",
              format!(
                "<:power:1392363667059904632> {}x\n<:attackspeed:1392364933722804274> {}x\n <:attacksize:1392364917616807956> [cj] {}x \n<:attacksize:1392364917616807956> [wl] {}x",
                &magic.imbued.damage, &magic.imbued.speed, &magic.imbued.size.conjurer, &magic.imbued.size.warlock
              ), true)
            .field("Outclashes", magic.clash.over.iter().map(|x| magic_string_into_emoji(x.to_string()).unwrap()).collect::<Vec<String>>().join("\n"), true)
            .field("Neutral clashes", magic.clash.neutral.iter().map(|x| magic_string_into_emoji(x.to_string()).unwrap()).collect::<Vec<String>>().join("\n"), true)
            .field("Outclashed by", magic.clash.under.iter().map(|x| magic_string_into_emoji(x.to_string()).unwrap()).collect::<Vec<String>>().join("\n"), true)
            .color(DEFAULT_COLOR)
            .footer(serenity::CreateEmbedFooter::new(EMBED_FOOTER));

        let response = poise::CreateReply::default().embed(embed);
        ctx.send(response).await?;
    } else {
        let response = poise::CreateReply::default()
            .content("❌ Magic not found!")
            .ephemeral(true);
        ctx.send(response).await?;
    }

    Ok(())
}

#[allow(dead_code)]
async fn autocomplete_magic(ctx: Context<'_>, partial: &str) -> impl Iterator<Item = String> {
    let data = ctx.data();
    let magics = data.magic_data.read();

    magics
        .iter()
        .filter(|magic| magic.name.to_lowercase().contains(&partial.to_lowercase()))
        .take(20)
        .map(|magic| magic.name.clone())
        .collect::<Vec<_>>()
        .into_iter()
}
