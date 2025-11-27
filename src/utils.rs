use crate::models::*;
use crate::*;
use anyhow::Result;
use once_cell::sync::Lazy;
use regex::Regex;
use reqwest::Client;
use scraper::{Html, Selector};
use serde_json;
use std::fs;
use std::time::Duration;
use tracing::{info, warn};

// HTTP client for making requests
static HTTP_CLIENT: Lazy<Client> = Lazy::new(|| {
    Client::builder()
        .timeout(Duration::from_secs(30))
        .build()
        .expect("Failed to create HTTP client")
});

// Regex for cleaning descriptions
static CLEAN_DESCRIPTION_REGEX: Lazy<Regex> =
    Lazy::new(|| Regex::new(r"\s+").expect("Failed to compile regex"));

pub async fn load_item_data(data: &Data) -> Result<()> {
    // Try to load from local file first
    if let Ok(file_content) = fs::read_to_string("items.json") {
        info!("items.json found, decoding...");
        match serde_json::from_str::<Vec<Item>>(&file_content) {
            Ok(items) => {
                info!("Successfully decoded items.json");
                *data.items_data.write() = items;
                initialize_item_cache(data).await;
                return Ok(());
            }
            Err(e) => {
                warn!("Failed to decode items.json: {}, falling back to API...", e);
            }
        }
    } else {
        warn!("items.json doesn't exist, fetching from API...");
    }

    // Fetch from API
    let response = HTTP_CLIENT
        .get("https://raw.githubusercontent.com/hozhai/odysseus/refs/heads/main/items.json")
        .send()
        .await?;

    let items: Vec<Item> = response.json().await?;

    // Save to file
    let json_content = serde_json::to_string_pretty(&items)?;
    fs::write("items.json", json_content)?;

    info!("Finished fetching item data from API");
    *data.items_data.write() = items;
    initialize_item_cache(data).await;

    Ok(())
}

pub async fn load_weapon_data(data: &Data) -> Result<()> {
    // Try to load from local file first
    if let Ok(file_content) = fs::read_to_string("weapons.json") {
        info!("weapons.json found, decoding...");
        match serde_json::from_str::<Vec<Weapon>>(&file_content) {
            Ok(weapons) => {
                info!("Successfully decoded weapons.json");
                *data.weapons_data.write() = weapons;
                initialize_weapon_cache(data).await;
                return Ok(());
            }
            Err(e) => {
                warn!(
                    "Failed to decode weapons.json: {}, falling back to API...",
                    e
                );
            }
        }
    } else {
        warn!("weapons.json doesn't exist, fetching from API...");
    }

    // Fetch from API
    let response = HTTP_CLIENT
        .get("https://raw.githubusercontent.com/hozhai/odysseus/refs/heads/main/weapons.json")
        .send()
        .await?;

    let weapons: Vec<Weapon> = response.json().await?;

    // Save to file
    let json_content = serde_json::to_string_pretty(&weapons)?;
    fs::write("weapons.json", json_content)?;

    info!("Finished fetching weapon data from API");
    *data.weapons_data.write() = weapons;
    initialize_weapon_cache(data).await;

    Ok(())
}

pub async fn load_magic_data(data: &Data) -> Result<()> {
    // Try to load from local file first
    if let Ok(file_content) = fs::read_to_string("magics.json") {
        info!("magics.json found, decoding...");
        match serde_json::from_str::<Vec<MagicData>>(&file_content) {
            Ok(magics) => {
                info!("Successfully decoded magics.json");
                *data.magic_data.write() = magics;
                initialize_magic_cache(data).await;
                return Ok(());
            }
            Err(e) => {
                warn!(
                    "Failed to decode magics.json: {}, falling back to API...",
                    e
                );
            }
        }
    } else {
        warn!("magics.json doesn't exist, fetching from API...");
    }

    // Fetch from API
    let response = HTTP_CLIENT
        .get("https://raw.githubusercontent.com/hozhai/odysseus/refs/heads/main/magics.json")
        .send()
        .await?;

    let magics: Vec<MagicData> = response.json().await?;

    // Save to file
    let json_content = serde_json::to_string_pretty(&magics)?;
    fs::write("magics.json", json_content)?;

    info!("Finished fetching magics data from API");
    *data.magic_data.write() = magics;
    initialize_magic_cache(data).await;

    Ok(())
}

async fn initialize_item_cache(data: &Data) {
    let items = data.items_data.read();
    if items.is_empty() {
        warn!("Items data is empty, cache not initialized");
        return;
    }

    let mut item_cache = data.item_cache.write();
    let mut name_cache = data.name_cache.write();
    let mut gems_list = data.gems_list.write();
    let mut enchants_list = data.enchants_list.write();
    let mut modifiers_list = data.modifiers_list.write();
    let mut enchant_to_emoji = data.enchant_to_emoji.write();
    let mut modifier_to_emoji = data.modifier_to_emoji.write();
    let mut gem_to_emoji = data.gem_to_emoji.write();
    let mut emoji_to_enchant = data.emoji_to_enchant.write();
    let mut emoji_to_modifier = data.emoji_to_modifier.write();
    let mut emoji_to_gem = data.emoji_to_gem.write();

    item_cache.clear();
    name_cache.clear();
    gems_list.clear();
    enchants_list.clear();
    modifiers_list.clear();

    for item in items.iter() {
        item_cache.insert(item.id.clone(), item.clone());
        name_cache.insert(item.name.to_lowercase(), item.clone());

        match item.main_type.as_str() {
            "Gem" => {
                if item.id != EMPTY_GEM_ID {
                    gems_list.push(item.id.clone());
                    if let Some(emoji) = gem_into_emoji(item) {
                        gem_to_emoji.insert(item.name.clone(), emoji.clone());
                        emoji_to_gem.insert(emoji, item.clone());
                    }
                }
            }
            "Modifier" => {
                if item.id != EMPTY_MODIFIER_ID {
                    modifiers_list.push(item.id.clone());
                    if let Some(emoji) = modifier_into_emoji(item) {
                        modifier_to_emoji.insert(item.name.clone(), emoji.clone());
                        emoji_to_modifier.insert(emoji, item.clone());
                    }
                }
            }
            "Enchant" => {
                if item.id != EMPTY_ENCHANTMENT_ID {
                    enchants_list.push(item.id.clone());
                    if let Some(emoji) = enchant_into_emoji(item) {
                        enchant_to_emoji.insert(item.name.clone(), emoji.clone());
                        emoji_to_enchant.insert(emoji, item.clone());
                    }
                }
            }
            _ => {}
        }
    }

    info!("Item cache initialized with {} items", item_cache.len());
}

async fn initialize_weapon_cache(data: &Data) {
    let weapons = data.weapons_data.read();
    if weapons.is_empty() {
        warn!("Weapons data is empty, cache not initialized");
        return;
    }

    let mut weapon_cache = data.weapon_cache.write();
    weapon_cache.clear();

    for weapon in weapons.iter() {
        weapon_cache.insert(weapon.name.to_lowercase(), weapon.clone());
    }

    info!(
        "Weapon cache initialized with {} weapons",
        weapon_cache.len()
    );
}

async fn initialize_magic_cache(data: &Data) {
    let magics = data.magic_data.read();
    if magics.is_empty() {
        warn!("Magics data is empty, cache not initialized");
        return;
    }

    let mut magic_cache = data.magic_cache.write();
    magic_cache.clear();

    for magic in magics.iter() {
        magic_cache.insert(magic.name.to_lowercase(), magic.clone());
    }

    info!("Magic cache initialized with {} magics", magic_cache.len())
}

pub fn find_item_by_id(data: &Data, id: &str) -> Item {
    let cache = data.item_cache.read();
    cache.get(id).cloned().unwrap_or_else(|| Item {
        id: id.to_string(),
        name: "Unknown".to_string(),
        legend: String::new(),
        main_type: String::new(),
        rarity: String::new(),
        image_id: String::new(),
        deleted: false,
        sub_type: None,
        gem_no: None,
        min_level: None,
        max_level: None,
        stat_type: None,
        stats_per_level: None,
        valid_modifiers: None,
        power_increment: None,
        defense_increment: None,
        agility_increment: None,
        attack_speed_increment: None,
        attack_size_increment: None,
        intensity_increment: None,
        regeneration_increment: None,
        piercing_increment: None,
        resistance_increment: None,
        insanity: None,
        warding: None,
        agility: None,
        attack_size: None,
        defense: None,
        drawback: None,
        power: None,
        attack_speed: None,
        intensity: None,
        piercing: None,
        regeneration: None,
        resistance: None,
    })
}

pub fn find_item_by_name(data: &Data, name: &str) -> Option<Item> {
    let cache = data.name_cache.read();
    cache.get(&name.to_lowercase()).cloned()
}

pub fn find_weapon_by_name(data: &Data, name: &str) -> Option<Weapon> {
    let cache = data.weapon_cache.read();
    cache.get(&name.to_lowercase()).cloned()
}

pub fn find_magic_by_name(data: &Data, name: &str) -> Option<MagicData> {
    let cache = data.magic_cache.read();
    cache.get(&name.to_lowercase()).cloned()
}

pub fn get_rarity_color(rarity: &str) -> u32 {
    match rarity {
        "Common" => COLOR_COMMON,
        "Uncommon" => COLOR_UNCOMMON,
        "Rare" => COLOR_RARE,
        "Exotic" => COLOR_EXOTIC,
        _ => COLOR_DEFAULT,
    }
}

pub fn magic_fs_into_emoji(content: i32) -> Option<String> {
    match content {
        // Magic cases
        0 => Some("<:acid:1393706537419145378>".to_string()),
        1 => Some("<:ash:1393706539273162842>".to_string()),
        2 => Some("<:crystal:1393706540850090064>".to_string()),
        3 => Some("<:earth:1393706543157088307>".to_string()),
        4 => Some("<:explosion:1393706544926949516>".to_string()),
        5 => Some("<:fire:1393706546453544980>".to_string()),
        6 => Some("<:glass:1393706547950915666>".to_string()),
        7 => Some("<:ice:1393706549716717628>".to_string()),
        8 => Some("<:light:1393706551495233629>".to_string()),
        9 => Some("<:lightning:1393706553650974831>".to_string()),
        10 => Some("<:magma:1393706555572224030>".to_string()),
        11 => Some("<:metal:1393706594142916808>".to_string()),
        12 => Some("<:plasma:1393706559401365674>".to_string()),
        13 => Some("<:poison:1393706598400135238>".to_string()),
        14 => Some("<:sand:1393706514249810062>".to_string()),
        15 => Some("<:shadow:1393706515747180596>".to_string()),
        16 => Some("<:snow:1393706517718372402>".to_string()),
        17 => Some("<:water:1393706519442489446>".to_string()),
        18 => Some("<:wind:1393706520889397360>".to_string()),
        19 => Some("<:wood:1393706523032682619>".to_string()),
        // Fighting Style cases
        20 => Some("<:basiccombat:1393706037227556864>".to_string()),
        21 => Some("<:boxing:1393706038892560626>".to_string()),
        22 => Some("<:ironleg:1393706043057504378>".to_string()),
        23 => Some("<:cannonfist:1393706041124061386>".to_string()),
        24 => Some("<:sailorstyle:1393706011428393031>".to_string()),
        25 => Some("<:thermofist:1393706015010324572>".to_string()),
        _ => None,
    }
}

pub fn magic_string_into_emoji(magic: String) -> Option<String> {
    match magic.as_str() {
        "Acid" => Some("<:acid:1443732219628617880>".to_string()),
        "Ash" => Some("<:ash:1443732218043170887>".to_string()),
        "Crystal" => Some("<:crystal:1443732216432820377>".to_string()),
        "Earth" => Some("<:earth:1443732214515765279>".to_string()),
        "Explosion" => Some("<:explosion:1443732212855078942>".to_string()),
        "Fire" => Some("<:fire:1443732211500187788>".to_string()),
        "Glass" => Some("<:glass:1443732209927196834>".to_string()),
        "Ice" => Some("<:ice:1443732208308191302>".to_string()),
        "Light" => Some("<:light:1443732206752370698>".to_string()),
        "Lightning" => Some("<:lightning:1443732205024182304>".to_string()),
        "Magma" => Some("<:magma:1443732203639935158>".to_string()),
        "Metal" => Some("<:metal:1443732202402611320>".to_string()),
        "Plasma" => Some("<:plasma:1443732201131741224>".to_string()),
        "Poison" => Some("<:poison:1443732199705936083>".to_string()),
        "Sand" => Some("<:sand:1443732197914972271>".to_string()),
        "Shadow" => Some("<:shadow:1443732196232790117>".to_string()),
        "Snow" => Some("<:snow:1443732194697806116>".to_string()),
        "Water" => Some("<:water:1443732192277692467>".to_string()),
        "Wind" => Some("<:wind:1443732191036047494>".to_string()),
        "Wood" => Some("<:wood:1443732189601599599>".to_string()),
        _ => None,
    }
}

pub fn enchant_into_emoji(item: &Item) -> Option<String> {
    match item.name.as_str() {
        "Strong" => Some("<:strong:1393732208673685615>".to_string()),
        "Hard" => Some("<:hard:1393732146514100334>".to_string()),
        "Nimble" => Some("<:nimble:1393732189136359656>".to_string()),
        "Amplified" => Some("<:amplified:1393732134249828422>".to_string()),
        "Bursting" => Some("<:bursting:1393732138754375801>".to_string()),
        "Swift" => Some("<:swift:1393732211379011624>".to_string()),
        "Powerful" => Some("<:powerful:1393732190595973180>".to_string()),
        "Armored" => Some("<:armored:1393732135604584489>".to_string()),
        "Agile" => Some("<:agile:1393732132588752946>".to_string()),
        "Enhanced" => Some("<:enhanced:1393732142772781076>".to_string()),
        "Explosive" => Some("<:explosive:1393732144869806151>".to_string()),
        "Brisk" => Some("<:brisk:1393732137315733564>".to_string()),
        "Charged" => Some("<:charged:1393732140533026846>".to_string()),
        "Virtuous" => Some("<:virtuous:1393732213480099940>".to_string()),
        "Hasty" => Some("<:hasty:1393732148699332718>".to_string()),
        "Healing" => Some("<:healing:1393732150288711690>".to_string()),
        "Resilience" => Some("<:resilience:1393732207155216404>".to_string()),
        "Piercing" => Some("<:piercing:1393732154491408507>".to_string()),
        _ => None,
    }
}

pub fn modifier_into_emoji(item: &Item) -> Option<String> {
    match item.name.as_str() {
        "Abyssal" => Some("<:abyssal:1393733751279718591>".to_string()),
        "Archaic" => Some("<:archaic:1393733752877744178>".to_string()),
        "Atlantean Essence" => Some("<:atlantean:1393733755088404665>".to_string()),
        "Blasted" => Some("<:blasted:1393733757537882144>".to_string()),
        "Crystalline" => Some("<:crystalline:1393733759114936443>".to_string()),
        "Drowned" => Some("<:drowned:1393733760670896128>".to_string()),
        "Frozen" => Some("<:frozen:1393733762541682870>".to_string()),
        "Superheated" => Some("<:superheated:1393733766517887006>".to_string()),
        "Sandy" => Some("<:sandy:1393733763938386000>".to_string()),
        _ => None,
    }
}

pub fn gem_into_emoji(item: &Item) -> Option<String> {
    match item.name.as_str() {
        "Defense Gem" => Some("<:defensegem:1393733031927349268>".to_string()),
        "Power Gem" => Some("<:powergem:1393733189289115710>".to_string()),
        "Attack Speed Gem" => Some("<:attackspeedgem:1393733075699105943>".to_string()),
        "Attack Size Gem" => Some("<:attacksizegem:1393733045210845336>".to_string()),
        "Agility Gem" => Some("<:agilitygem:1393733033659469926>".to_string()),
        "Intensity Gem" => Some("<:intensitygem:1393733041079324734>".to_string()),
        "Lapiz Lazuli" => Some("<:lapislazuli:1393733050508251177>".to_string()),
        "Larimar" => Some("<:larimar:1393733187091435520>".to_string()),
        "Agate" => Some("<:agate:1393733030019076177>".to_string()),
        "Malachite" => Some("<:malachite:1393733054895231077>".to_string()),
        "Candelaria" => Some("<:candelaria:1393733039049408657>".to_string()),
        "Morenci" => Some("<:morenci:1393733059039465562>".to_string()),
        "Painite" => Some("<:painite:1393733069969817762>".to_string()),
        "Kyanite" => Some("<:kyanite:1393733049115611136>".to_string()),
        "Variscite" => Some("<:variscite:1393733193798123560>".to_string()),
        "Perfect Azurite" => Some("<:azurite:1393733037447184394>".to_string()),
        "Perfect Aventurine" => Some("<:aventurine:1393733035450699910>".to_string()),
        "Perfect Fire Opal" => Some("<:fireopal:1393733046792093837>".to_string()),
        _ => None,
    }
}

pub fn get_enchant_emoji(data: &Data, item: &Item) -> String {
    let enchant_map = data.enchant_to_emoji.read();
    enchant_map.get(&item.name).cloned().unwrap_or_default()
}

pub fn get_modifier_emoji(data: &Data, item: &Item) -> String {
    let modifier_map = data.modifier_to_emoji.read();
    modifier_map.get(&item.name).cloned().unwrap_or_default()
}

pub fn get_gem_emoji(data: &Data, item: &Item) -> String {
    let gem_map = data.gem_to_emoji.read();
    gem_map.get(&item.name).cloned().unwrap_or_default()
}

pub fn _emoji_to_enchant(data: &Data, emoji: &str) -> Option<Item> {
    let emoji_map = data.emoji_to_enchant.read();
    emoji_map.get(emoji).cloned()
}

pub fn _emoji_to_modifier(data: &Data, emoji: &str) -> Option<Item> {
    let emoji_map = data.emoji_to_modifier.read();
    emoji_map.get(emoji).cloned()
}

pub fn _emoji_to_gem(data: &Data, emoji: &str) -> Option<Item> {
    let emoji_map = data.emoji_to_gem.read();
    emoji_map.get(emoji).cloned()
}

pub async fn search_wiki(query: &str) -> Result<Vec<WikiSearchResult>> {
    let encoded_query = urlencoding::encode(query);
    let search_url = format!(
        "https://roblox-arcane-odyssey.fandom.com/wiki/Special:Search?scope=internal&navigationSearch=true&query={}",
        encoded_query
    );

    let response = HTTP_CLIENT.get(&search_url).send().await?;
    if !response.status().is_success() {
        return Err(anyhow::anyhow!(
            "Search request failed with status: {}",
            response.status()
        ));
    }

    let html_content = response.text().await?;
    let document = Html::parse_document(&html_content);

    let results = extract_search_results(&document);
    Ok(results)
}

fn extract_search_results(document: &Html) -> Vec<WikiSearchResult> {
    let mut results = Vec::new();

    let result_selector = Selector::parse(".unified-search__result").unwrap();
    let title_selector = Selector::parse(".unified-search__result__title").unwrap();
    let snippet_selector = Selector::parse(".unified-search__result__snippet").unwrap();

    for result_element in document.select(&result_selector) {
        let mut title = String::new();
        let mut url = String::new();
        let mut description = String::new();

        // Extract title and URL
        if let Some(title_element) = result_element.select(&title_selector).next() {
            title = title_element.text().collect::<String>().trim().to_string();
            if let Some(href) = title_element.value().attr("href") {
                url = if href.starts_with('/') {
                    format!("https://roblox-arcane-odyssey.fandom.com{}", href)
                } else {
                    href.to_string()
                };
            }
        }

        // Extract description
        if let Some(snippet_element) = result_element.select(&snippet_selector).next() {
            description = snippet_element
                .text()
                .collect::<String>()
                .trim()
                .to_string();
            description = CLEAN_DESCRIPTION_REGEX
                .replace_all(&description, " ")
                .to_string();
        }

        if !title.is_empty() {
            results.push(WikiSearchResult {
                title,
                description,
                url,
            });
        }
    }

    results
}

pub fn format_total_stats(stats: &TotalStats) -> String {
    let mut result = String::new();

    let stat_entries = [
        ("<:power:1392363667059904632>", stats.power),
        ("<:defense:1392364201262977054>", stats.defense),
        ("<:agility:1392364894573297746>", stats.agility),
        ("<:attackspeed:1392364933722804274>", stats.attack_speed),
        ("<:attacksize:1392364917616807956>", stats.attack_size),
        ("<:intensity:1392365008049934377>", stats.intensity),
        ("<:regeneration:1392365064010469396>", stats.regeneration),
        ("<:piercing:1392365031705808986>", stats.piercing),
        ("<:resistance:1393458741009186907>", stats.resistance),
        ("<:drawback:1392364965905563698>", stats.drawback),
        ("<:warding:1392366478560596039>", stats.warding),
        ("<:insanity:1392364984658301031>", stats.insanity),
    ];

    for (emoji, value) in stat_entries {
        if value != 0 {
            result.push_str(&format!("{} {}\n", emoji, value));
        }
    }

    if result.is_empty() {
        "No stats".to_string()
    } else {
        result
    }
}

pub fn unhash_build_code(code: &str) -> Result<Player> {
    let mut slot_code_array: Vec<Vec<String>> = Vec::new();
    let mut player = Player {
        level: 0,
        vitality_points: 0,
        magic_points: 0,
        strength_points: 0,
        weapon_points: 0,
        magics: Vec::new(),
        fighting_styles: Vec::new(),
        accessories: Vec::new(),
        chestplate: Slot::default(),
        boots: Slot::default(),
    };

    // Split the code by '|' and then by ','
    for section in code.split('|') {
        slot_code_array.push(section.split(',').map(|s| s.to_string()).collect());
    }

    // Bounds check
    if slot_code_array.len() < 8 {
        return Err(anyhow::anyhow!(
            "Invalid build code format: expected at least 8 sections, got {}",
            slot_code_array.len()
        ));
    }

    if slot_code_array[0].len() < 5 {
        return Err(anyhow::anyhow!(
            "Invalid stats section: expected 5 values, got {}",
            slot_code_array[0].len()
        ));
    }

    // Parse stat allocations
    player.level = slot_code_array[0][0]
        .parse()
        .map_err(|_| anyhow::anyhow!("Failed to parse player level: {}", slot_code_array[0][0]))?;

    player.vitality_points = slot_code_array[0][1].parse().map_err(|_| {
        anyhow::anyhow!("Failed to parse vitality points: {}", slot_code_array[0][1])
    })?;

    player.magic_points = slot_code_array[0][2]
        .parse()
        .map_err(|_| anyhow::anyhow!("Failed to parse magic points: {}", slot_code_array[0][2]))?;

    player.strength_points = slot_code_array[0][3].parse().map_err(|_| {
        anyhow::anyhow!("Failed to parse strength points: {}", slot_code_array[0][3])
    })?;

    player.weapon_points = slot_code_array[0][4]
        .parse()
        .map_err(|_| anyhow::anyhow!("Failed to parse weapon points: {}", slot_code_array[0][4]))?;

    // Parse magics
    if !slot_code_array[1].is_empty() && !slot_code_array[1][0].is_empty() {
        for magic_str in &slot_code_array[1] {
            if magic_str.is_empty() {
                continue;
            }
            let magic_index: usize = magic_str
                .parse()
                .map_err(|_| anyhow::anyhow!("Failed to parse magic index: {}", magic_str))?;

            let magic = match magic_index {
                0 => Magic::Acid,
                1 => Magic::Ash,
                2 => Magic::Crystal,
                3 => Magic::Earth,
                4 => Magic::Explosion,
                5 => Magic::Fire,
                6 => Magic::Glass,
                7 => Magic::Ice,
                8 => Magic::Light,
                9 => Magic::Lightning,
                10 => Magic::Magma,
                11 => Magic::Metal,
                12 => Magic::Plasma,
                13 => Magic::Poison,
                14 => Magic::Sand,
                15 => Magic::Shadow,
                16 => Magic::Snow,
                17 => Magic::Water,
                18 => Magic::Wind,
                19 => Magic::Wood,
                _ => return Err(anyhow::anyhow!("Invalid magic index: {}", magic_index)),
            };
            player.magics.push(magic);
        }
    }

    // Parse fighting styles
    if !slot_code_array[2].is_empty() && !slot_code_array[2][0].is_empty() {
        for fs_str in &slot_code_array[2] {
            if fs_str.is_empty() {
                continue;
            }
            let fs_index: usize = fs_str
                .parse()
                .map_err(|_| anyhow::anyhow!("Failed to parse fighting style index: {}", fs_str))?;

            let fighting_style = match fs_index {
                0 => FightingStyle::BasicCombat,
                1 => FightingStyle::Boxing,
                2 => FightingStyle::IronLeg,
                3 => FightingStyle::CannonFist,
                4 => FightingStyle::SailorStyle,
                5 => FightingStyle::ThermoFist,
                _ => {
                    return Err(anyhow::anyhow!(
                        "Invalid fighting style index: {}",
                        fs_index
                    ))
                }
            };
            player.fighting_styles.push(fighting_style);
        }
    }

    // Parse accessories (3 slots)
    player
        .accessories
        .push(parse_item_slot(&slot_code_array[3])?);
    player
        .accessories
        .push(parse_item_slot(&slot_code_array[4])?);
    player
        .accessories
        .push(parse_item_slot(&slot_code_array[5])?);

    // Parse armor and boots
    player.chestplate = parse_item_slot(&slot_code_array[6])?;
    player.boots = parse_item_slot(&slot_code_array[7])?;

    Ok(player)
}

fn parse_item_slot(slot_code: &[String]) -> Result<Slot> {
    if slot_code.len() < 4 || slot_code.len() > 7 {
        return Err(anyhow::anyhow!(
            "Invalid slot format: expected 4-7 values, got {}",
            slot_code.len()
        ));
    }

    let mut slot = Slot {
        item: slot_code[0].clone(),
        enchant: slot_code[1].clone(),
        modifier: slot_code[2].clone(),
        gems: Vec::new(),
        level: MAX_LEVEL,
    };

    // Parse based on number of elements
    match slot_code.len() {
        4 => {
            // No gem slots
            slot.level = slot_code[3]
                .parse()
                .map_err(|_| anyhow::anyhow!("Error parsing item level: {}", slot_code[3]))?;
        }
        5 => {
            // 1 gem slot
            slot.gems.push(slot_code[3].clone());
            slot.level = slot_code[4]
                .parse()
                .map_err(|_| anyhow::anyhow!("Error parsing item level: {}", slot_code[4]))?;
        }
        6 => {
            // 2 gem slots
            slot.gems.push(slot_code[3].clone());
            slot.gems.push(slot_code[4].clone());
            slot.level = slot_code[5]
                .parse()
                .map_err(|_| anyhow::anyhow!("Error parsing item level: {}", slot_code[5]))?;
        }
        7 => {
            // 3 gem slots
            slot.gems.push(slot_code[3].clone());
            slot.gems.push(slot_code[4].clone());
            slot.gems.push(slot_code[5].clone());
            slot.level = slot_code[6]
                .parse()
                .map_err(|_| anyhow::anyhow!("Error parsing item level: {}", slot_code[6]))?;
        }
        _ => {
            return Err(anyhow::anyhow!("Failed to determine gem slot amount"));
        }
    }

    Ok(slot)
}

pub fn calculate_total_stats(player: &Player, data: &Data) -> TotalStats {
    let mut total = TotalStats::default();

    // Calculate stats for all equipped items
    for accessory in &player.accessories {
        add_item_stats(accessory, &mut total, data);
    }
    add_item_stats(&player.chestplate, &mut total, data);
    add_item_stats(&player.boots, &mut total, data);

    total
}

pub fn add_item_stats(slot: &Slot, total: &mut TotalStats, data: &Data) {
    // Skip empty slots
    if slot.item == EMPTY_ACCESSORY_ID
        || slot.item == EMPTY_CHESTPLATE_ID
        || slot.item == EMPTY_BOOTS_ID
    {
        return;
    }

    let mut slot_stats = TotalStats::default();
    let item = find_item_by_id(data, &slot.item);
    let enchantment = find_item_by_id(data, &slot.enchant);
    let modifier = find_item_by_id(data, &slot.modifier);

    let level = ((slot.level as f64) / 10.0).floor() * 10.0;
    let multiplier = ((slot.level as f64) / 10.0).floor();

    // Base item stats (at the slot's level)
    if let Some(stats_per_level) = &item.stats_per_level {
        let mut level_stats_found = false;

        // Find the appropriate stats for the item level
        for stat_level in stats_per_level {
            if stat_level.level == level as i32 {
                level_stats_found = true;
                slot_stats.agility += stat_level.agility.unwrap_or(0);
                slot_stats.attack_size += stat_level.attack_size.unwrap_or(0);
                slot_stats.attack_speed += stat_level.attack_speed.unwrap_or(0);
                slot_stats.defense += stat_level.defense.unwrap_or(0);
                slot_stats.drawback += stat_level.drawback.unwrap_or(0);
                slot_stats.intensity += stat_level.intensity.unwrap_or(0);
                slot_stats.piercing += stat_level.piercing.unwrap_or(0);
                slot_stats.power += stat_level.power.unwrap_or(0);
                slot_stats.regeneration += stat_level.regeneration.unwrap_or(0);
                slot_stats.resistance += stat_level.resistance.unwrap_or(0);
                slot_stats.warding += stat_level.warding.unwrap_or(0);
                break;
            }
        }

        // If no exact level match, use the last available level
        if !level_stats_found && !stats_per_level.is_empty() {
            let last_stat = &stats_per_level[stats_per_level.len() - 1];
            slot_stats.agility += last_stat.agility.unwrap_or(0);
            slot_stats.attack_size += last_stat.attack_size.unwrap_or(0);
            slot_stats.attack_speed += last_stat.attack_speed.unwrap_or(0);
            slot_stats.defense += last_stat.defense.unwrap_or(0);
            slot_stats.drawback += last_stat.drawback.unwrap_or(0);
            slot_stats.intensity += last_stat.intensity.unwrap_or(0);
            slot_stats.piercing += last_stat.piercing.unwrap_or(0);
            slot_stats.power += last_stat.power.unwrap_or(0);
            slot_stats.regeneration += last_stat.regeneration.unwrap_or(0);
            slot_stats.resistance += last_stat.resistance.unwrap_or(0);
            slot_stats.warding += last_stat.warding.unwrap_or(0);
        }
    }

    // Fixed item stats
    slot_stats.power += item.power.unwrap_or(0);
    slot_stats.defense += item.defense.unwrap_or(0);
    slot_stats.agility += item.agility.unwrap_or(0);
    slot_stats.attack_speed += item.attack_speed.unwrap_or(0);
    slot_stats.attack_size += item.attack_size.unwrap_or(0);
    slot_stats.intensity += item.intensity.unwrap_or(0);
    slot_stats.regeneration += item.regeneration.unwrap_or(0);
    slot_stats.piercing += item.piercing.unwrap_or(0);
    slot_stats.resistance += item.resistance.unwrap_or(0);
    slot_stats.insanity += item.insanity.unwrap_or(0);
    slot_stats.warding += item.warding.unwrap_or(0);
    slot_stats.drawback += item.drawback.unwrap_or(0);

    // Enchantment stats
    if enchantment.id != EMPTY_ENCHANTMENT_ID && !slot.enchant.is_empty() {
        slot_stats.power +=
            (enchantment.power_increment.unwrap_or(0.0) * multiplier).floor() as i32;
        slot_stats.defense +=
            (enchantment.defense_increment.unwrap_or(0.0) * multiplier).floor() as i32;
        slot_stats.agility +=
            (enchantment.agility_increment.unwrap_or(0.0) * multiplier).floor() as i32;
        slot_stats.attack_speed +=
            (enchantment.attack_speed_increment.unwrap_or(0.0) * multiplier).floor() as i32;
        slot_stats.attack_size +=
            (enchantment.attack_size_increment.unwrap_or(0.0) * multiplier).floor() as i32;
        slot_stats.intensity +=
            (enchantment.intensity_increment.unwrap_or(0.0) * multiplier).floor() as i32;
        slot_stats.regeneration +=
            (enchantment.regeneration_increment.unwrap_or(0.0) * multiplier).floor() as i32;
        slot_stats.piercing +=
            (enchantment.piercing_increment.unwrap_or(0.0) * multiplier).floor() as i32;
        slot_stats.resistance +=
            (enchantment.resistance_increment.unwrap_or(0.0) * multiplier).floor() as i32;
        slot_stats.warding += enchantment.warding.unwrap_or(0);
    }

    // Gem stats
    for gem_id in &slot.gems {
        if gem_id != EMPTY_GEM_ID && !gem_id.is_empty() {
            let gem = find_item_by_id(data, gem_id);
            slot_stats.power += gem.power.unwrap_or(0);
            slot_stats.defense += gem.defense.unwrap_or(0);
            slot_stats.agility += gem.agility.unwrap_or(0);
            slot_stats.attack_speed += gem.attack_speed.unwrap_or(0);
            slot_stats.attack_size += gem.attack_size.unwrap_or(0);
            slot_stats.intensity += gem.intensity.unwrap_or(0);
            slot_stats.regeneration += gem.regeneration.unwrap_or(0);
            slot_stats.piercing += gem.piercing.unwrap_or(0);
            slot_stats.resistance += gem.resistance.unwrap_or(0);
            slot_stats.drawback += gem.drawback.unwrap_or(0);
        }
    }

    // Modifier incremental stats
    if modifier.name != "Atlantean Essence"
        && modifier.id != EMPTY_MODIFIER_ID
        && !slot.modifier.is_empty()
    {
        slot_stats.agility +=
            (modifier.agility_increment.unwrap_or(0.0) * multiplier).floor() as i32;
        slot_stats.attack_size +=
            (modifier.attack_size_increment.unwrap_or(0.0) * multiplier).floor() as i32;
        slot_stats.attack_speed +=
            (modifier.attack_speed_increment.unwrap_or(0.0) * multiplier).floor() as i32;
        slot_stats.defense +=
            (modifier.defense_increment.unwrap_or(0.0) * multiplier).floor() as i32;
        slot_stats.intensity +=
            (modifier.intensity_increment.unwrap_or(0.0) * multiplier).floor() as i32;
        slot_stats.piercing +=
            (modifier.piercing_increment.unwrap_or(0.0) * multiplier).floor() as i32;
        slot_stats.power += (modifier.power_increment.unwrap_or(0.0) * multiplier).floor() as i32;
        slot_stats.regeneration +=
            (modifier.regeneration_increment.unwrap_or(0.0) * multiplier).floor() as i32;
        slot_stats.resistance +=
            (modifier.resistance_increment.unwrap_or(0.0) * multiplier).floor() as i32;
    } else if modifier.name == "Atlantean Essence" {
        // Special handling for Atlantean Essence
        slot_stats.insanity += 1;
        let multiplier_int = multiplier as i32;

        if slot_stats.power == 0 {
            slot_stats.power += 1 * multiplier_int;
        } else if slot_stats.defense == 0 {
            slot_stats.defense += (9.07 * multiplier).floor() as i32;
        } else if slot_stats.attack_size == 0 {
            slot_stats.attack_size += 3 * multiplier_int;
        } else if slot_stats.attack_speed == 0 {
            slot_stats.attack_speed += 3 * multiplier_int;
        } else if slot_stats.agility == 0 {
            slot_stats.agility += 3 * multiplier_int;
        } else if slot_stats.intensity == 0 {
            slot_stats.intensity += 3 * multiplier_int;
        } else {
            slot_stats.power += 1 * multiplier_int;
        }
    }

    // Add slot stats to total
    total.power += slot_stats.power;
    total.defense += slot_stats.defense;
    total.agility += slot_stats.agility;
    total.attack_speed += slot_stats.attack_speed;
    total.attack_size += slot_stats.attack_size;
    total.intensity += slot_stats.intensity;
    total.regeneration += slot_stats.regeneration;
    total.piercing += slot_stats.piercing;
    total.resistance += slot_stats.resistance;
    total.insanity += slot_stats.insanity;
    total.warding += slot_stats.warding;
    total.drawback += slot_stats.drawback;
}

// Sorting functionality

#[derive(Debug, Clone)]
pub struct SortableItem {
    pub item: Item,
    pub value: i32,
}

pub async fn filter_and_sort_items(
    data: &Data,
    stat_type: &str,
    item_type: Option<&str>,
) -> Vec<SortableItem> {
    let items_data = data.items_data.read();
    let mut sortable_items = Vec::new();

    for item in items_data.iter() {
        // Skip deleted items, "None" items, and items without stats
        if item.deleted || item.name == "None" || item.stats_per_level.is_none() {
            continue;
        }

        // Apply item type filter if specified
        if let Some(filter_type) = item_type {
            if !filter_type.is_empty() && item.main_type != filter_type {
                continue;
            }
        }

        // Check if item has the stat at level 140
        if let Some(stat_value) = get_stat_value_at_level_140(item, stat_type) {
            if stat_value > 0 {
                sortable_items.push(SortableItem {
                    item: item.clone(),
                    value: stat_value,
                });
            }
        }
    }

    // Sort by value in descending order (highest first)
    sortable_items.sort_by(|a, b| b.value.cmp(&a.value));

    sortable_items
}

pub fn get_stat_value_at_level_140(item: &Item, stat_type: &str) -> Option<i32> {
    if let Some(ref stats_per_level) = item.stats_per_level {
        for stats in stats_per_level {
            if stats.level == 140 {
                return match stat_type {
                    "power" => stats.power,
                    "agility" => stats.agility,
                    "attackspeed" => stats.attack_speed,
                    "defense" => stats.defense,
                    "attacksize" => stats.attack_size,
                    "intensity" => stats.intensity,
                    "regeneration" => stats.regeneration,
                    "resistance" => stats.resistance,
                    "armorpiercing" => stats.piercing,
                    _ => None,
                };
            }
        }
    }
    None
}

pub fn get_type_filter(item_type: Option<&str>) -> String {
    match item_type {
        Some(t) if !t.is_empty() => format!(" for {} items", t.to_lowercase()),
        _ => String::new(),
    }
}

pub fn get_stat_display_name(stat_type: &str) -> &str {
    match stat_type {
        "power" => "Power",
        "agility" => "Agility",
        "attackspeed" => "Attack Speed",
        "defense" => "Defense",
        "attacksize" => "Attack Size",
        "intensity" => "Intensity",
        "regeneration" => "Regeneration",
        "resistance" => "Resistance",
        "armorpiercing" => "Armor Piercing",
        _ => stat_type,
    }
}

// Weapon stat visualization
pub fn create_weapon_stat_bar(value: f64, min: f64, max: f64, emoji: &str) -> String {
    let normalized = ((value - min) / (max - min)).clamp(0.0, 1.0);
    let scaled = (normalized * 9.0).round() as i32 + 1;
    let filled = scaled.clamp(1, 10);

    emoji.repeat(filled as usize)
}

// Interactive Item Editor System

pub async fn build_item_editor_response(
    slot: &Slot,
    data: &Data,
) -> (serenity::CreateEmbed, Vec<serenity::CreateActionRow>) {
    let item = find_item_by_id(data, &slot.item);
    let enchantment = find_item_by_id(data, &slot.enchant);
    let modifier = find_item_by_id(data, &slot.modifier);

    // Calculate total stats for this slot
    let mut total_stats = TotalStats::default();
    add_item_stats(slot, &mut total_stats, data);

    // Build embed
    let mut embed = serenity::CreateEmbed::new()
        .title(&item.name)
        .description(&item.legend)
        .thumbnail(&item.image_id)
        .field("Type", &item.main_type, true)
        .field("Rarity", &item.rarity, true)
        .field("Level", slot.level.to_string(), true)
        .color(get_rarity_color(&item.rarity))
        .footer(serenity::CreateEmbedFooter::new(crate::EMBED_FOOTER));

    // Add enchantment field
    if enchantment.name != "None"
        && !slot.enchant.is_empty()
        && slot.enchant != crate::EMPTY_ENCHANTMENT_ID
    {
        let enchant_emoji = get_enchant_emoji(data, &enchantment);
        embed = embed.field(
            "Enchantment",
            format!("{} {}", enchant_emoji, enchantment.name),
            true,
        );
    }

    // Add modifier field
    if modifier.name != "None"
        && !slot.modifier.is_empty()
        && slot.modifier != crate::EMPTY_MODIFIER_ID
    {
        let modifier_emoji = get_modifier_emoji(data, &modifier);
        embed = embed.field(
            "Modifier",
            format!("{} {}", modifier_emoji, modifier.name),
            true,
        );
    }

    // Add gems field if item has gem slots
    if let Some(gem_slots) = item.gem_no {
        if gem_slots > 0 {
            let mut gems_text = String::new();
            for i in 0..gem_slots {
                if i < slot.gems.len() as i32
                    && !slot.gems[i as usize].is_empty()
                    && slot.gems[i as usize] != crate::EMPTY_GEM_ID
                {
                    let gem = find_item_by_id(data, &slot.gems[i as usize]);
                    let gem_emoji = get_gem_emoji(data, &gem);
                    gems_text.push_str(&format!("{} {}\n", gem_emoji, gem.name));
                } else {
                    gems_text.push_str("Empty Slot\n");
                }
            }
            embed = embed.field("Gems", gems_text, true);
        }
    }

    // Add total stats
    embed = embed.field("Total Stats", format_total_stats(&total_stats), false);

    // Build components
    let mut components = Vec::new();

    // First row - item modification buttons
    let mut buttons = vec![serenity::CreateButton::new("item_add_enchant")
        .style(serenity::ButtonStyle::Primary)
        .label("Set Enchantment")];

    // Only show modifier button if item supports modifiers
    if let Some(valid_modifiers) = &item.valid_modifiers {
        if !valid_modifiers.is_empty() {
            buttons.push(
                serenity::CreateButton::new("item_add_modifier")
                    .style(serenity::ButtonStyle::Primary)
                    .label("Set Modifier"),
            );
        }
    }

    // Only show gems button if item has gem slots
    if let Some(gem_slots) = item.gem_no {
        if gem_slots > 0 {
            buttons.push(
                serenity::CreateButton::new("item_add_gem")
                    .style(serenity::ButtonStyle::Primary)
                    .label("Set Gems"),
            );
        }
    }

    if !buttons.is_empty() {
        components.push(serenity::CreateActionRow::Buttons(buttons));
    }

    // Second row - level controls
    let level_buttons = vec![
        serenity::CreateButton::new("item_level_down")
            .style(serenity::ButtonStyle::Secondary)
            .label("-10")
            .disabled(slot.level <= item.min_level.unwrap_or(10)),
        serenity::CreateButton::new("item_level_up")
            .style(serenity::ButtonStyle::Secondary)
            .label("+10")
            .disabled(slot.level >= crate::MAX_LEVEL),
        serenity::CreateButton::new("item_level_max")
            .style(serenity::ButtonStyle::Secondary)
            .label("Max Level")
            .disabled(slot.level >= crate::MAX_LEVEL),
    ];

    components.push(serenity::CreateActionRow::Buttons(level_buttons));

    (embed, components)
}

// Convert item slot to formatted stats string
pub fn item_to_stats(slot: &crate::models::Slot, data: &Data) -> String {
    let item = find_item_by_id(data, &slot.item);

    let mut stats = vec![
        format!("Item: {}", item.name),
        format!("Level: {}", slot.level),
    ];

    if !slot.enchant.is_empty() && slot.enchant != crate::EMPTY_ENCHANTMENT_ID {
        let enchant = find_item_by_id(data, &slot.enchant);
        stats.push(format!("Enchantment: {}", enchant.name));
    }

    if !slot.modifier.is_empty() && slot.modifier != crate::EMPTY_MODIFIER_ID {
        let modifier = find_item_by_id(data, &slot.modifier);
        stats.push(format!("Modifier: {}", modifier.name));
    }

    if !slot.gems.is_empty() {
        let gems: Vec<String> = slot
            .gems
            .iter()
            .filter(|g| !g.is_empty() && *g != crate::EMPTY_GEM_ID)
            .map(|g| find_item_by_id(data, g).name.clone())
            .collect();
        if !gems.is_empty() {
            stats.push(format!("Gems: {}", gems.join(", ")));
        }
    }

    stats.join("\n")
}

// Build slot field text helper for build command
pub fn build_slot_field_text(slot: &Slot, data: &Data) -> String {
    let item = find_item_by_id(data, &slot.item);
    let mut text = format!("{}", item.name);

    if !slot.enchant.is_empty() && slot.enchant != crate::EMPTY_ENCHANTMENT_ID {
        let enchant = find_item_by_id(data, &slot.enchant);
        if let Some(emoji) = enchant_into_emoji(&enchant) {
            text.push_str(&format!("\n{}", emoji));
        }
    }

    if !slot.modifier.is_empty() && slot.modifier != crate::EMPTY_MODIFIER_ID {
        let modifier = find_item_by_id(data, &slot.modifier);
        if let Some(emoji) = modifier_into_emoji(&modifier) {
            text.push_str(&format!(" {}", emoji));
        }
    }

    if !slot.gems.is_empty() {
        let gems: Vec<String> = slot
            .gems
            .iter()
            .filter(|g| !g.is_empty() && *g != crate::EMPTY_GEM_ID)
            .filter_map(|g| gem_into_emoji(&find_item_by_id(data, g)))
            .collect();
        if !gems.is_empty() {
            text.push_str(&format!("\n{}", gems.join(" ")));
        }
    }

    text.push_str(&format!("\n**Level:** {}", slot.level));
    text
}
