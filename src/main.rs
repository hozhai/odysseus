use anyhow::Result;
use parking_lot::RwLock;
use poise::serenity_prelude as serenity;
use serenity::{Client, GatewayIntents};
use sqlx::mysql::MySqlPoolOptions;
use std::collections::HashMap;
use std::sync::Arc;
use tracing::info;

mod commands;
mod database;
mod events;
mod item_interactions;
mod modal_interactions;
mod models;
mod utils;

use commands::*;
use database::Database;
use models::*;
use utils::*;

pub type Error = Box<dyn std::error::Error + Send + Sync>;
pub type Context<'a> = poise::Context<'a, Data, Error>;

// Application data
pub struct Data {
    pub db: Database,
    pub item_cache: Arc<RwLock<HashMap<String, Item>>>,
    pub weapon_cache: Arc<RwLock<HashMap<String, Weapon>>>,
    pub name_cache: Arc<RwLock<HashMap<String, Item>>>,
    pub items_data: Arc<RwLock<Vec<Item>>>,
    pub weapons_data: Arc<RwLock<Vec<Weapon>>>,
    pub gems_list: Arc<RwLock<Vec<String>>>,
    pub enchants_list: Arc<RwLock<Vec<String>>>,
    pub modifiers_list: Arc<RwLock<Vec<String>>>,
    pub enchant_to_emoji: Arc<RwLock<HashMap<String, String>>>,
    pub modifier_to_emoji: Arc<RwLock<HashMap<String, String>>>,
    pub gem_to_emoji: Arc<RwLock<HashMap<String, String>>>,
    pub emoji_to_enchant: Arc<RwLock<HashMap<String, Item>>>,
    pub emoji_to_modifier: Arc<RwLock<HashMap<String, Item>>>,
    pub emoji_to_gem: Arc<RwLock<HashMap<String, Item>>>,
    pub magic_data: Arc<RwLock<Vec<MagicData>>>,
    pub magic_cache: Arc<RwLock<HashMap<String, MagicData>>>,
}

// Global constants
pub static EMBED_FOOTER: &str = "Odysseus - Made with ❤️";
pub static BUILD_URL_PREFIX: &str = "https://tools.arcaneodyssey.net/gearBuilder#";
pub static INVALID_URL_MSG: &str = "Invalid URL! Please provide a valid GearBuilder build URL.";
pub static ITEM_NOT_FOUND_MSG: &str = "Item not found!";
pub static DEFAULT_COLOR: u32 = 0x93b1e3;
pub static SUCCESS_COLOR: u32 = 0x00ff00;
pub static ERROR_COLOR: u32 = 0xff0000;
pub static VERSION: &str = "v1.0.1";
pub static MAX_LEVEL: i32 = 140;

// Color constants
pub static COLOR_DEFAULT: u32 = 0x93b1e3;
pub static COLOR_COMMON: u32 = 0xffffff;
pub static COLOR_UNCOMMON: u32 = 0x7f734c;
pub static COLOR_RARE: u32 = 0x6765e4;
pub static COLOR_EXOTIC: u32 = 0xea3323;

// Empty item IDs
pub static EMPTY_ACCESSORY_ID: &str = "AAA";
pub static EMPTY_CHESTPLATE_ID: &str = "AAB";
pub static EMPTY_BOOTS_ID: &str = "AAC";
pub static EMPTY_ENCHANTMENT_ID: &str = "AAD";
pub static EMPTY_MODIFIER_ID: &str = "AAE";
pub static EMPTY_GEM_ID: &str = "AAF";

#[tokio::main]
async fn main() -> Result<()> {
    // Initialize tracing
    tracing_subscriber::fmt::init();

    // Load environment variables
    dotenvy::dotenv().ok();

    let token = std::env::var("TOKEN").expect("TOKEN must be set in environment");
    let db_url = std::env::var("DB_URL").expect("DB_URL must be set in environment");

    // Validate environment variables
    if token.is_empty() {
        eprintln!("❌ ERROR: TOKEN is empty in .env file");
        std::process::exit(1);
    }

    if db_url.is_empty() || db_url == "mysql://username:password@localhost:3306/database_name" {
        eprintln!("❌ ERROR: DB_URL is not configured properly in .env file");
        std::process::exit(1);
    }

    // Basic sanity check to help catch common DSN mistakes (e.g. Go-style DSN without scheme)
    if !db_url.starts_with("mysql://") {
        eprintln!(
            "❌ ERROR: DB_URL must be a valid MySQL URL starting with 'mysql://'.\n   Example: mysql://user:pass@host:3306/db_name?ssl-mode=DISABLED\n   If your current value looks like 'user:pass@tcp(host:3306)/db', convert it to the URL form."
        );
        std::process::exit(1);
    }

    info!("Starting Odysseus Discord Bot {}", VERSION);

    // Initialize database with connection pool configuration
    info!("Connecting to database...");
    let db_pool = MySqlPoolOptions::new()
        .max_connections(5)
        .min_connections(1)
        .acquire_timeout(std::time::Duration::from_secs(30))
        .idle_timeout(std::time::Duration::from_secs(600))
        .max_lifetime(std::time::Duration::from_secs(1800))
        .connect(&db_url)
        .await
        .map_err(|e| {
            eprintln!("❌ Failed to connect to database: {}", e);
        })
        .unwrap();

    info!("Database connection established successfully");
    let database = Database::new(db_pool);

    // Initialize data structures
    let data = Data {
        db: database,
        item_cache: Arc::new(RwLock::new(HashMap::new())),
        weapon_cache: Arc::new(RwLock::new(HashMap::new())),
        name_cache: Arc::new(RwLock::new(HashMap::new())),
        items_data: Arc::new(RwLock::new(Vec::new())),
        weapons_data: Arc::new(RwLock::new(Vec::new())),
        gems_list: Arc::new(RwLock::new(Vec::new())),
        enchants_list: Arc::new(RwLock::new(Vec::new())),
        modifiers_list: Arc::new(RwLock::new(Vec::new())),
        enchant_to_emoji: Arc::new(RwLock::new(HashMap::new())),
        modifier_to_emoji: Arc::new(RwLock::new(HashMap::new())),
        gem_to_emoji: Arc::new(RwLock::new(HashMap::new())),
        emoji_to_enchant: Arc::new(RwLock::new(HashMap::new())),
        emoji_to_modifier: Arc::new(RwLock::new(HashMap::new())),
        emoji_to_gem: Arc::new(RwLock::new(HashMap::new())),
        magic_data: Arc::new(RwLock::new(Vec::new())),
        magic_cache: Arc::new(RwLock::new(HashMap::new())),
    };

    // Load item and weapon data
    load_item_data(&data).await?;
    load_weapon_data(&data).await?;
    load_magic_data(&data).await?;

    let framework = poise::Framework::builder()
        .options(poise::FrameworkOptions {
            commands: vec![
                help(),
                latency(),
                about(),
                wiki(),
                build(),
                item(),
                weapon(),
                damagecalc(),
                sort(),
                ping(),
                pingset(),
                magic(),
            ],
            event_handler: |ctx, event, framework, data| {
                Box::pin(events::event_handler(ctx, event, framework, data))
            },
            ..Default::default()
        })
        .setup(|ctx, _ready, framework| {
            Box::pin(async move {
                poise::builtins::register_globally(ctx, &framework.options().commands).await?;
                Ok(data)
            })
        })
        .build();

    let intents = GatewayIntents::GUILDS
        | GatewayIntents::GUILD_MESSAGES
        | GatewayIntents::DIRECT_MESSAGES
        | GatewayIntents::non_privileged();

    let mut client = Client::builder(&token, intents)
        .framework(framework)
        .await?;

    info!("Successfully logged in. Starting bot...");
    client.start().await?;

    Ok(())
}
