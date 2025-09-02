use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Item {
    pub id: String,
    pub name: String,
    pub legend: String,
    #[serde(rename = "mainType")]
    pub main_type: String,
    pub rarity: String,
    #[serde(rename = "imageId")]
    pub image_id: String,
    pub deleted: bool,
    #[serde(rename = "subType")]
    pub sub_type: Option<String>,
    #[serde(rename = "gemNo")]
    pub gem_no: Option<i32>,
    #[serde(rename = "minLevel")]
    pub min_level: Option<i32>,
    #[serde(rename = "maxLevel")]
    pub max_level: Option<i32>,
    #[serde(rename = "statType")]
    pub stat_type: Option<String>,
    #[serde(rename = "statsPerLevel")]
    pub stats_per_level: Option<Vec<StatsPerLevel>>,
    #[serde(rename = "validModifiers")]
    pub valid_modifiers: Option<Vec<String>>,

    // Increment stats
    #[serde(rename = "powerIncrement")]
    pub power_increment: Option<f64>,
    #[serde(rename = "defenseIncrement")]
    pub defense_increment: Option<f64>,
    #[serde(rename = "agilityIncrement")]
    pub agility_increment: Option<f64>,
    #[serde(rename = "attackSpeedIncrement")]
    pub attack_speed_increment: Option<f64>,
    #[serde(rename = "attackSizeIncrement")]
    pub attack_size_increment: Option<f64>,
    #[serde(rename = "intensityIncrement")]
    pub intensity_increment: Option<f64>,
    #[serde(rename = "regenerationIncrement")]
    pub regeneration_increment: Option<f64>,
    #[serde(rename = "piercingIncrement")]
    pub piercing_increment: Option<f64>,
    #[serde(rename = "resistanceIncrement")]
    pub resistance_increment: Option<f64>,

    // Base stats
    pub insanity: Option<i32>,
    pub warding: Option<i32>,
    pub agility: Option<i32>,
    #[serde(rename = "attackSize")]
    pub attack_size: Option<i32>,
    pub defense: Option<i32>,
    pub drawback: Option<i32>,
    pub power: Option<i32>,
    #[serde(rename = "attackSpeed")]
    pub attack_speed: Option<i32>,
    pub intensity: Option<i32>,
    pub piercing: Option<i32>,
    pub regeneration: Option<i32>,
    pub resistance: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StatsPerLevel {
    pub level: i32,
    pub power: Option<i32>,
    pub agility: Option<i32>,
    pub defense: Option<i32>,
    #[serde(rename = "attackSpeed")]
    pub attack_speed: Option<i32>,
    #[serde(rename = "attackSize")]
    pub attack_size: Option<i32>,
    pub intensity: Option<i32>,
    pub warding: Option<i32>,
    pub drawback: Option<i32>,
    pub regeneration: Option<i32>,
    pub piercing: Option<i32>,
    pub resistance: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Weapon {
    pub name: String,
    pub legend: String,
    pub rarity: String,
    #[serde(rename = "imageId")]
    pub image_id: String,
    pub damage: f64,
    pub speed: f64,
    pub size: f64,
    #[serde(rename = "specialEffect")]
    pub special_effect: String,
    pub efficiency: f64,
    pub durability: Option<i32>,
    #[serde(rename = "blockingPower")]
    pub blocking_power: Option<f64>,
}

#[derive(Debug, Clone)]
pub struct Player {
    pub level: i32,
    pub vitality_points: i32,
    pub magic_points: i32,
    pub strength_points: i32,
    pub weapon_points: i32,
    pub magics: Vec<Magic>,
    pub fighting_styles: Vec<FightingStyle>,
    pub accessories: Vec<Slot>,
    pub chestplate: Slot,
    pub boots: Slot,
}

#[derive(Debug, Clone)]
pub struct Slot {
    pub item: String,
    pub gems: Vec<String>,
    pub enchant: String,
    pub modifier: String,
    pub level: i32,
}

#[derive(Debug, Clone, Default)]
pub struct TotalStats {
    pub power: i32,
    pub defense: i32,
    pub agility: i32,
    pub attack_speed: i32,
    pub attack_size: i32,
    pub intensity: i32,
    pub regeneration: i32,
    pub piercing: i32,
    pub resistance: i32,
    pub insanity: i32,
    pub warding: i32,
    pub drawback: i32,
}

#[derive(Debug, Clone, Copy)]
pub enum Magic {
    Acid = 0,
    Ash = 1,
    Crystal = 2,
    Earth = 3,
    Explosion = 4,
    Fire = 5,
    Glass = 6,
    Ice = 7,
    Light = 8,
    Lightning = 9,
    Magma = 10,
    Metal = 11,
    Plasma = 12,
    Poison = 13,
    Sand = 14,
    Shadow = 15,
    Snow = 16,
    Water = 17,
    Wind = 18,
    Wood = 19,
}

#[derive(Debug, Clone, Copy)]
pub enum FightingStyle {
    BasicCombat = 20,
    Boxing = 21,
    IronLeg = 22,
    CannonFist = 23,
    SailorStyle = 24,
    ThermoFist = 25,
}

#[derive(Debug, Clone)]
pub struct WikiSearchResult {
    pub title: String,
    pub description: String,
    pub url: String,
}

// impl Magic {
//     pub fn all() -> Vec<Magic> {
//         vec![
//             Magic::Ash,
//             Magic::Acid,
//             Magic::Crystal,
//             Magic::Earth,
//             Magic::Explosion,
//             Magic::Fire,
//             Magic::Glass,
//             Magic::Ice,
//             Magic::Light,
//             Magic::Lightning,
//             Magic::Magma,
//             Magic::Metal,
//             Magic::Plasma,
//             Magic::Poison,
//             Magic::Sand,
//             Magic::Shadow,
//             Magic::Snow,
//             Magic::Water,
//             Magic::Wind,
//             Magic::Wood,
//         ]
//     }
// }

// impl FightingStyle {
//     pub fn all() -> Vec<FightingStyle> {
//         vec![
//             FightingStyle::BasicCombat,
//             FightingStyle::Boxing,
//             FightingStyle::IronLeg,
//             FightingStyle::CannonFist,
//             FightingStyle::SailorStyle,
//             FightingStyle::ThermoFist,
//         ]
//     }
// }

impl Default for Slot {
    fn default() -> Self {
        Self {
            item: String::new(),
            gems: Vec::new(),
            enchant: String::new(),
            modifier: String::new(),
            level: crate::MAX_LEVEL,
        }
    }
}
